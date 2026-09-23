#!/usr/bin/env python3
"""Turn an OCR'd 族谱 branch (intermediate JSON) into a missingu GenealogyDataset.

The source book (《李氏族谱·陇西贵州李代龙支系谱》第二卷) records each person as
  第N代  李{name}：{配偶}生：{子女}
so the intermediate we hand-build during OCR is a flat list of people, each with
its own given name, its FATHER's given name (resolved from page context — the one
list a person appears in), spouse(s), and the given names of children. Fathers are
linked by (generation, father-name); leaves that only appear in a 生：list get
their own node so the tree is complete.

Usage:
  python build_lipu_dataset.py <intermediate.json> [--write]
Dry-run prints the dataset + a sanity report; --write saves {branchKey}.lipu.data.json
into modules/genealogy/import/sources/.
"""
import json, os, sys, re

SOURCES_DIR = os.path.normpath(os.path.join(
    os.path.dirname(__file__), "..", "..",
    "modules", "genealogy", "import", "sources"))
NAMESPACE = "lipu-lidailong"


def norm_name(surname, given):
    given = (given or "").strip()
    if not given:
        return None
    # Some entries already carry the surname; most give only the given name.
    return given if given.startswith(surname) else surname + given


def year_of(s):
    if not s:
        return None
    m = re.search(r"(1[0-9]{3}|20[0-2][0-9])", str(s))
    return int(m.group(1)) if m else None


def build(inter):
    surname = inter.get("surname", "李")
    branch = inter["branchKey"]
    cutoff = inter.get("livingCutoff", 1940)
    citation = inter.get("citation", "《李氏族谱·陇西贵州李代龙支系谱》第二卷")
    clan = inter.get("clanName", "陇西李氏·李代龙支系")
    hometown = inter.get("hometown")  # 谱籍地/村，如 "贵州织金·桂果镇马场村"
    gen_chars = inter.get("generationChars", {})  # {"19":"崇", ...} 字辈

    people = {}      # id -> obj
    relations = []
    seen_rel = set()
    # index of explicit entries by (gen, given-name) so fathers resolve uniquely
    by_gen_name = {}

    def pid(gen, given, disamb=0):
        base = f"lipu:{branch}:{gen}-{given}"
        return base if disamb == 0 else f"{base}#{disamb}"

    def add_person(gen, given, birth=None, death=None, gender=None, bio=None,
                   is_lineage=True, aliases=None):
        # disambiguate same given-name in same generation
        disamb = 0
        while pid(gen, given, disamb) in people:
            disamb += 1
        pid_ = pid(gen, given, disamb)
        # Married-in spouses keep their own name (张氏 / 张华珍); only patrilineal
        # members take the branch surname prepended.
        display = norm_name(surname, given) if is_lineage else given.strip()
        obj = {"externalId": pid_, "name": display, "citation": citation}
        if gender:
            obj["gender"] = gender
        if aliases:
            obj["aliases"] = aliases
        gc = gen_chars.get(str(gen))
        if gc and is_lineage:
            obj["generationName"] = gc
        yb, yd = year_of(birth), year_of(death)
        if yb:
            obj["birth"] = {"year": yb}
        if yd:
            obj["death"] = {"year": yd}
        living = bool(yb and not yd and yb >= cutoff)
        if living:
            obj["living"] = True
        # 谱籍地既作祖籍，也落到「出生地」「逝世地」结构化字段——比生平文字更利于
        # 按地区搜索/收录。逝世地仅对已故者设置。
        if hometown and is_lineage:
            obj["ancestralHometown"] = hometown
            obj["birthPlace"] = {"region": hometown}
            if not living:
                obj["deathPlace"] = {"region": hometown}
        people[pid_] = obj
        by_gen_name.setdefault((gen, given), []).append(pid_)
        return pid_

    def add_rel(r):
        sig = json.dumps(r, sort_keys=True, ensure_ascii=False)
        if sig not in seen_rel:
            seen_rel.add(sig)
            relations.append(r)

    entries = inter["people"]

    # Pass 1: create a node for every explicit 第N代 entry.
    for e in entries:
        e["_id"] = add_person(e["gen"], e["name"], e.get("birth"),
                              e.get("death"), e.get("gender"), e.get("bio"),
                              aliases=e.get("aliases"))

    # helper: resolve a father entry-id from (childGen, fatherGivenName)
    def father_id(child_gen, father_name):
        cands = by_gen_name.get((child_gen - 1, father_name), [])
        return cands[0] if len(cands) == 1 else (cands[0] if cands else None)

    # Pass 2: parent edges (child -> father) + spouse edges + leaf children.
    for e in entries:
        gen, gid = e["gen"], e["_id"]
        # link to father
        fa = e.get("father")
        if fa:
            fid = father_id(gen, fa)
            if fid:
                add_rel({"kind": "parent", "parent": fid, "child": gid})
            else:
                e["_orphanFather"] = fa
        # spouse(s)
        for sp in ([{"spouse": e.get("spouse"), "note": e.get("spouseNote"),
                     "children": e.get("children", [])}]
                   + e.get("extraSpouses", [])):
            name = (sp.get("spouse") or "").strip()
            if name and name not in ("失考", "失记", "姓失考"):
                # 旧谱里妇女多只记「某氏」无名。突出为「{夫}之妻」更利于识别，
                # 原「张氏」留作可搜索别名；有全名的（如张华珍）保留本名。
                husband = people[gid]["name"]
                if re.match(r"^.{1,2}氏$", name):
                    sid = add_person(gen, f"{husband}之妻", gender="female",
                                     is_lineage=False, aliases=[name])
                else:
                    sid = add_person(gen, name, gender="female", is_lineage=False)
                a, b = sorted([gid, sid])
                add_rel({"kind": "spouse", "a": a, "b": b})
        # leaf children: given names in 生：list that have no explicit next-gen entry
        for sp in ([{"children": e.get("children", [])}] + e.get("extraSpouses", [])):
            for ch in sp.get("children", []):
                ch = ch.strip()
                if not ch:
                    continue
                if by_gen_name.get((gen + 1, ch)):
                    continue  # explicit entry exists; its own father= links it
                cid = add_person(gen + 1, ch)
                add_rel({"kind": "parent", "parent": gid, "child": cid})

    # Pass 3: compose an identity bio for each explicit lineage member, so a page
    # is more than a name — 世代/字辈/谱籍地/排行 + the book's own 履历 (if any).
    for e in entries:
        obj = people[e["_id"]]
        parts = [f"{clan}第{e['gen']}代"]
        gc = gen_chars.get(str(e["gen"]))
        if gc:
            parts[0] += f"（字辈“{gc}”）"
        if hometown:
            parts.append(hometown)
        if e.get("rank"):
            parts.append(e["rank"])  # 排行，如 "崇彬长子"
        head = "，".join(parts) + "。"
        book_bio = (e.get("bio") or "").strip()
        obj["bio"] = (head + book_bio) if book_bio else head

    ds = {"key": f"lipu:{branch}", "namespace": NAMESPACE,
          "people": list(people.values()), "relations": relations}
    orphans = [e for e in entries if e.get("_orphanFather")]
    return ds, orphans


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    if len(sys.argv) < 2:
        print("usage: build_lipu_dataset.py <intermediate.json> [--write]")
        sys.exit(1)
    inter = json.load(open(sys.argv[1], encoding="utf-8"))
    ds, orphans = build(inter)
    living = sum(1 for p in ds["people"] if p.get("living"))
    print(f"=== {inter.get('branchLabel', inter['branchKey'])} ===")
    print(f"人物 {len(ds['people'])} (在世{living}) · 关系 {len(ds['relations'])}")
    for p in ds["people"]:
        yb = p.get("birth", {}).get("year", "")
        liv = " [在世]" if p.get("living") else ""
        print(f"  {p['externalId']:<28} {p['name']} {yb}{liv}")
    if orphans:
        print("\n⚠️ 未挂上父节点(需核对):",
              [(e['name'], e.get('_orphanFather')) for e in orphans])
    out = os.path.join(SOURCES_DIR, f"{inter['branchKey']}.lipu.data.json")
    if "--write" in sys.argv:
        json.dump(ds, open(out, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
        print("\n✓ 写入", out)
    else:
        print("\n（dry-run，加 --write 才写入源目录）")


if __name__ == "__main__":
    main()

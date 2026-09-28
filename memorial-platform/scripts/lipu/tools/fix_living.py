"""Find (and with --write, fix) lipu people whose own Gregorian birth year the
build script missed, which left post-1940 living people with public pages.

Mirrors build_lipu_dataset.py: birth only from the person's own clause (before
the first 偶/姙/妣/配), living = born >= 1940 and no death, a living person's
undated spouse is hidden too, and undated descendants of a living or 1911+-born
parent are presumed living.
"""
from pathlib import Path
SOURCES = Path(__file__).resolve().parents[3] / "modules" / "genealogy" / "import" / "sources"

import json, glob, re, sys, os

SRC = str(SOURCES)
CUTOFF, MODERN = 1940, 1911
YR = r"(1[89]\d{2}|20[0-2]\d)"
BEFORE = re.compile(YR + r"\s*年(?:\s*(\d{1,2})\s*月)?(?:\s*(\d{1,2})\s*[日号])?[^，。；]*?生(?!有)")
AFTER = re.compile(r"生于\s*" + YR + r"\s*年(?:\s*(\d{1,2})\s*月)?(?:\s*(\d{1,2})\s*[日号])?")
SPLIT = re.compile(r"[，。；、]\s*(?:续|再)?(?:偶|姙|妣|配)")


def own_birth(bio):
    own = SPLIT.split(bio or "", maxsplit=1)[0]
    for clause in re.split(r"[，。；]", own):
        m = BEFORE.search(clause) or AFTER.search(clause)
        if m:
            d = {"year": int(m.group(1))}
            mo, dy = m.group(2), m.group(3)
            if mo and 1 <= int(mo) <= 12:
                d["month"] = int(mo)
                if dy and 1 <= int(dy) <= 31:
                    d["day"] = int(dy)
            return d
    return None


def fix(ds):
    people = {p["externalId"]: p for p in ds["people"]}
    changes = []
    for p in ds["people"]:
        if p.get("birth", {}).get("year"):
            continue
        if not p["externalId"].startswith(ds["key"] + ":"):
            continue  # stub owned by another file
        b = own_birth(p.get("bio", ""))
        if not b:
            continue
        raw = p.get("birth", {}).get("raw")
        p["birth"] = dict(b, **({"raw": raw} if raw else {}))
        if b["year"] >= CUTOFF and "death" not in p and not p.get("living"):
            p["living"] = True
            p.pop("deathPlace", None)
            changes.append((p["name"], b["year"]))
    # spouse of a living person, undated → hidden
    for r in ds["relations"]:
        if r["kind"] != "spouse":
            continue
        for a, b2 in ((r["a"], r["b"]), (r["b"], r["a"])):
            pa, pb = people.get(a), people.get(b2)
            if (pa and pb and pa.get("living") and pa.get("clanName") and not pb.get("clanName")
                    and "death" not in pb and not pb.get("living")):
                pb["living"] = True
                pb.pop("deathPlace", None)
                changes.append((pb["name"] + "(配偶)", None))
    # presume-living propagation
    parent = {r["child"]: r["parent"] for r in ds["relations"] if r["kind"] == "parent"}
    changed = True
    while changed:
        changed = False
        for pid, p in people.items():
            if p.get("living") or "birth" in p or "death" in p:
                continue
            par = people.get(parent.get(pid))
            if not par:
                continue
            py = par.get("birth", {}).get("year")
            if par.get("living") or (py and py >= MODERN):
                p["living"] = True
                p.pop("deathPlace", None)
                changes.append((p["name"] + "(后代)", None))
                changed = True
    return changes


def sync_stubs(write):
    """A person split across files (stub + owner) must be living in every copy
    if any copy says so — otherwise importing the stub file first would create a
    public page for a living person."""
    import collections
    files = {f: json.load(open(f, encoding="utf-8")) for f in glob.glob(os.path.join(SRC, "*.lipu.data.json"))}
    living = collections.defaultdict(bool)
    for ds in files.values():
        for p in ds["people"]:
            living[p["externalId"]] |= bool(p.get("living"))
    n = 0
    for f, ds in files.items():
        hit = False
        for p in ds["people"]:
            if living[p["externalId"]] and not p.get("living"):
                p["living"] = True; p.pop("deathPlace", None); p.pop("death", None)
                n += 1; hit = True
                print("stub-sync", os.path.basename(f), p["name"])
        if hit and write:
            json.dump(ds, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    return n


def main():
    write = "--write" in sys.argv
    total = sync_stubs(write)
    for f in sorted(glob.glob(os.path.join(SRC, "*.lipu.data.json"))):
        ds = json.load(open(f, encoding="utf-8"))
        ch = fix(ds)
        if ch:
            total += len(ch)
            key = os.path.basename(f).replace(".lipu.data.json", "")
            print(key, "|", "、".join(f"{n}{'('+str(y)+')' if y else ''}" for n, y in ch))
            if write:
                json.dump(ds, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("TOTAL newly hidden:", total, "(written)" if write else "(dry-run)")


if __name__ == "__main__":
    main()

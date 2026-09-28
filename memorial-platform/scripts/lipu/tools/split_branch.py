"""Split an oversized inter.json by moving named houses into their own files.

usage: split_branch.py <dir> <key> <newkey>=<parentName>[,<parentName>...]:<label> ...

For each group, every explicit person below the listed parents (by father chain)
moves to <newkey>; each listed parent stays in <key> with children [] and a bio
note, and appears in <newkey> as a stub anchored on its original externalId.
"""
from pathlib import Path
SOURCES = Path(__file__).resolve().parents[3] / "modules" / "genealogy" / "import" / "sources"

import json, os, sys

d_dir, key = sys.argv[1], sys.argv[2]
path = os.path.join(d_dir, f"{key}.inter.json")
src = json.load(open(path, encoding="utf-8"))
people = src["people"]
outs, stub_refs = [], {}

for spec in sys.argv[3:]:
    newkey, rest = spec.split("=", 1)
    names, label = rest.split(":", 1)
    parents = names.split(",")
    by = {(p["gen"], p["name"]): p for p in people}
    heads = [p for p in people if p["name"] in parents and p.get("children")]
    moved, frontier = [], {(h["gen"], h["name"]) for h in heads}
    changed = True
    while changed:
        changed = False
        for p in people:
            # fatherIndex entries have an ambiguous same-name father; never sweep
            # them by name — name them as a group head instead.
            if p in moved or not p.get("father") or p.get("fatherIndex") is not None:
                continue
            if (p["gen"] - 1, p["father"]) in frontier:
                moved.append(p); frontier.add((p["gen"], p["name"])); changed = True
    # Moved people get new lipu:{newkey}: ids; if an earlier group in this run
    # left a stub pointing at one of them (a house head moved again), repoint it.
    # Re-splitting an already-published split still breaks — run check_stubs.py.
    for m in moved:
        if "externalId" not in m:
            # Only the very head object an earlier stub was made for — a same-name
            # cousin moving elsewhere must not steal that stub.
            for st, head in stub_refs.get(f"lipu:{key}:{m['gen']}-{m['name']}", []):
                if head is m:
                    st["externalId"] = f"lipu:{newkey}:{m['gen']}-{m['name']}"
    stubs = []
    for h in heads:
        pid = h.get("externalId") or f"lipu:{key}:{h['gen']}-{h['name']}"
        stubs.append({"gen": h["gen"], "name": h["name"], "father": None, "spouse": None,
                      "children": [c for c in h["children"] if not any(m["name"] == c and m["gen"] == h["gen"] + 1 for m in moved)],
                      "externalId": pid,
                      **{k: h[k] for k in ("birth", "death") if k in h}})
        stub_refs.setdefault(pid, []).append((stubs[-1], h))
        h["children"] = []
        h["bio"] = (h.get("bio") or "") + ("。" if h.get("bio") else "") + f"子嗣见{label}"
    people = [p for p in people if p not in moved]
    out = dict(src, branchKey=newkey, branchLabel=src["branchLabel"].split("（")[0] + "·" + label + "（上承" + "、".join(parents) + "）",
               people=stubs + moved)
    outs.append((newkey, out))

for newkey, out in outs:
    json.dump(out, open(os.path.join(d_dir, f"{newkey}.inter.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(newkey, len(out["people"]), "explicit")

src["people"] = people
json.dump(src, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(key, len(people), "explicit left")

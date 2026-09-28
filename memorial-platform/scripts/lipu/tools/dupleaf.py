from pathlib import Path
SOURCES = Path(__file__).resolve().parents[3] / "modules" / "genealogy" / "import" / "sources"
import json,sys,collections
for f in sys.argv[1:]:
  d=json.load(open(f,encoding='utf-8'))
  expl={(p['gen'],p['name']) for p in d['people']}
  c=collections.defaultdict(list)
  for p in d['people']:
    for ch in p.get('children',[]): c[(p['gen']+1,ch)].append(p['name'])
  for k,v in c.items():
    if len(v)>1 and sum(1 for p in d['people'] if (p['gen'],p['name'])==k)<len(v): print(f.split('/')[-1],k,v)

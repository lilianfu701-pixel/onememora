from pathlib import Path
SOURCES = Path(__file__).resolve().parents[3] / "modules" / "genealogy" / "import" / "sources"
import sys
p=str(SOURCES / "lipu-families.ts")
s=open(p,encoding="utf-8").read()
after=sys.argv[1]; pairs=[a.split("=",1) for a in sys.argv[2:]]
import re
ia=f'import lipu_{after} from "./{after}.lipu.data.json";'
assert ia in s, "anchor import missing"
s=s.replace(ia, ia+"".join(f'\nimport lipu_{k} from "./{k}.lipu.data.json";' for k,_ in pairs))
m=re.search(rf'\n  {after}: "[^"]*",', s); assert m
s=s[:m.end()]+"".join(f'\n  {k}: "{l}",' for k,l in pairs)+s[m.end():]
da=f'  ["{after}", lipu_{after} as GenealogyDataset],'
assert da in s
s=s.replace(da, da+"".join(f'\n  ["{k}", lipu_{k} as GenealogyDataset],' for k,_ in pairs))
open(p,"w",encoding="utf-8").write(s); print("registered",[k for k,_ in pairs])

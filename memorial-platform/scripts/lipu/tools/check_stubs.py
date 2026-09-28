from pathlib import Path
SOURCES = Path(__file__).resolve().parents[3] / "modules" / "genealogy" / "import" / "sources"
import json,glob,os,sys
own={}; stubs=[]
for f in glob.glob(str(SOURCES / '*.lipu.data.json')):
  d=json.load(open(f,encoding='utf-8')); k=os.path.basename(f).split('.')[0]
  for p in d['people']:
    i=p['externalId']
    if i.startswith(f'lipu:{k}:'): own[i]=k
    else: stubs.append((k,i))
bad=[(k,i) for k,i in stubs if i not in own]
for b in bad: print('DANGLING',*b)
print('stubs',len(stubs),'dangling',len(bad))

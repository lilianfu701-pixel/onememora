from pathlib import Path
SOURCES = Path(__file__).resolve().parents[3] / "modules" / "genealogy" / "import" / "sources"
import json, glob, os, sys
src = str(SOURCES)
session = """litianyuan lizongwu lihonglian lihongshun liziquan lijinzhong lijinzhongdegui lijinzhongdelong
lijinzhongruxian lijinrongnc lijinrongnc2 lizongbao lizaichen lijiyongfu lijiyongfu2 lipengchen lipengchen2
limanyong limanfu lichaochen lijianyou lijianyouzl lijianyouzm lizhenghai lizhenghai2 liruyan liruyanfeng
litiancai lifuting lifuting2 lishide lishidechongyuan lichongzhen""".split()
extra = sys.argv[1:]
session += extra
def count(k):
    d = json.load(open(os.path.join(src, k + ".lipu.data.json"), encoding="utf-8"))
    stub = sum(1 for p in d["people"] if not p["externalId"].startswith(f"lipu:{k}:"))
    return len(d["people"]) - stub, sum(1 for p in d["people"] if p.get("living"))
tot = liv = 0
for k in session:
    n, l = count(k); tot += n; liv += l
allfiles = glob.glob(os.path.join(src, "*.lipu.data.json"))
grand = 0
for f in allfiles:
    k = os.path.basename(f).replace(".lipu.data.json", "")
    grand += count(k)[0]
print(f"本次会话: {len(session)} 支文件, {tot} 人 (其中隐藏在世 {liv}, 公开 {tot-liv})")
print(f"李代龙谱全部已注册: {len(allfiles)} 支文件, {grand} 人")

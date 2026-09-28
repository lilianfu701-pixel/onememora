# 纸质族谱书籍 → missingu.org 导入规则（Codex / Claude 共用）

本文件是整理族谱书籍并推上 missingu.org 的**唯一权威规则**。Codex 与 Claude 同时在做，
任何一方都按这里执行；与本文冲突的旧说法一律作废。

---

## 0. 三条红线

1. **不碰生产数据库。** 不连 Supabase、不跑生产 SQL、不写生产表。数据只以「数据集 JSON 文件」
   进仓库，由站长在后台 `/admin/genealogy` 点「批量导入所选」写库。本地复现问题只用本机
   `memorial_dev` 库。
2. **推送只用** `git push onememora HEAD:main`。只 `git add` 本次改动的具体路径，**禁止 `git add -A`**，
   禁止推 `origin`。不提交 `.env*`、密钥、PDF、页面截图、`*.inter.json` 中间文件。
3. **不虚构。** 书里没写的父子、生卒、配偶一律不补。父亲未载 → `father: null` 另立根，bio 写
   「谱列第N代，未载其父」。疑误照录并注明「谱载如此」「当为…之误」。

## 1. 分工（开工前先登记，防止两边做重）

- Claude：《李氏族谱·陇西贵州李代龙支系谱》**第二卷**，从 PDF idx458（印刷页 439）往后到结束。
- Codex：**其它书**（其它卷、其它姓氏族谱）。若要做第二卷任何页，先和站长确认。
- 开工前在 `docs/genealogy-ledger.md` 追加一行：`书名 | PDF 页范围 | 负责人 | 日期`，完成后补提交号。
  文件不存在就创建。

## 2. 技术栈（回复团队清单）

| 项 | 值 |
|---|---|
| 前端 | Next.js 16（App Router）+ React，next-intl 多语言 |
| 后端 | Next.js Route Handlers / Server Actions，TypeScript |
| 数据库 | PostgreSQL（生产 Supabase；本地 `memorial_dev`） |
| ORM | Drizzle ORM 0.45（`db/schema/*.ts`，迁移在 `drizzle/`） |
| 部署 | push `onememora/main` → Vercel 自动部署 |
| 导入 | **不是 API，也不是 CSV/SQL**：仓库内静态 JSON 数据集 → 后台按钮导入 |

相关代码：
- 数据契约：`modules/genealogy/import/types.ts`（`GenealogyDataset` / `SourcePerson` / `SourceRelation`）
- 导入器：`modules/genealogy/import/importer.ts`（幂等、可续灌、可回滚 `unimport.ts`）
- 表结构：`db/schema/genealogy.ts`（`family_people`、`family_links`）、`db/schema/memorial.ts`（`memorials`、`deceased_people`）
- 李代龙谱注册表：`modules/genealogy/import/sources/lipu-families.ts`
- 构建脚本：`scripts/lipu/build_lipu_dataset.py`；工具：`scripts/lipu/tools/*.py`

## 3. 数据模型（团队问题 2–5 的答案）

我们**不设** `persons / relationships / branches / sources / review_issues` 五张新表，而是映射到现有结构：

| 你的概念 | 落点 |
|---|---|
| persons | `SourcePerson` → 已故者生成追思页（`memorials`+`deceased_people`）+ 图节点 `family_people`；在世者只生成图节点 |
| relationships | `SourceRelation`，只有两种：`parent`（父→子，有向）、`spouse`（对称）。兄弟、祖孙、叔侄由亲属引擎推算，**禁止**写入 |
| branches | 一个「支」= 一个数据集文件 `<branchKey>.lipu.data.json`，支名写在 `lipu-families.ts` 的 LABELS |
| sources | 每人 `citation`（书名＋卷），bio 里写原文摘录；页码写进 commit 信息与 ledger |
| review_issues | 不入库。存疑写进 bio（「谱载如此」「未载其父」），重大问题写进 commit 信息 |

**人物唯一性 / 判重**：唯一键 `import_key = import:{namespace}:{externalId}`（`family_people.import_key` 唯一索引）。
- `externalId` 规则：`lipu:{branchKey}:{世代}-{名}`，同文件同代同名自动加 `#1`、`#2`。
- 重复导入同一 externalId = 跳过（幂等），不会建第二页。
- 跨支同一人：在新文件里写同一个 externalId（「stub 锚点」），两支就接成一棵树。**写锚点前必须
  `grep` 确认该 id 已存在。**
- 不做「姓名+世代」模糊合并；拿不准是否同一人 → 不锚定，另立并在 bio 注明。

**配偶**：`spouse` 写姓氏或全名（「张氏」「杨光珍」），构建脚本自动生成配偶节点（`李X之妻`）。
续娶用 `extraSpouses: [{spouse, birth, death, children}]`，或在 bio 里写「续姙某氏生…」。
**世代**：inter 文件里的 `gen` 数字，不从关系推算；显示为「第N代」。
**股/房**：不建模为字段，体现在支名（如「·德安房」）和拆文件上。
**根节点**：每个数据集的最高代人物；跨支用 stub 接上，不指定全谱唯一根。
**关系性质**（亲生/过继/继母）：`family_links.nature` 存在但导入统一 `unspecified`；过继、养子写进 bio。

## 4. 工作流程（每一批）

1. 渲染 PDF 页：
   ```python
   import fitz
   d = fitz.open(r"<书.pdf>")
   d[idx].get_pixmap(dpi=135).save(f"<临时目录>/idx{idx}.png")
   ```
   第二卷：印刷页 = PDF 0 起索引 − 19。
2. 看图逐条转录，写一个 Python 生成器输出 `<branchKey>.inter.json`（放临时目录，不进仓库）：
   ```json
   {"branchKey": "lichaoyangljc",
    "branchLabel": "马场镇李家村·李朝阳一支（上承…，Gen11-19）",
    "surname": "李", "citation": "《李氏族谱·陇西贵州李代龙支系谱》第二卷",
    "clanName": "陇西李氏·李代龙支系", "hometown": "贵州普定·马场镇陈家寨",
    "livingCutoff": 1940, "presumeLivingFromGen": 19,
    "people": [
      {"gen": 16, "name": "春友", "father": "天荣", "spouse": "林氏",
       "bio": "生于1849年12月30日，葬于癞子洞，姙林氏1853年生于盆河林家寨",
       "children": ["正祥", "正云", "正发", "正元"],
       "birth": {"year": 1849}, "spouseBirth": {"year": 1853}},
      {"gen": 15, "name": "天荣", "father": null, "externalId": "lipu:lixxx:15-天荣", "children": ["春友"]}
    ]}
   ```
   - `name` 只写名（不带姓），构建时加姓。
   - `children` 里没有显式条目的名字自动成为叶子节点。
   - 同代两位同名父亲：子女条目加 `"fatherIndex": 0/1`（按条目出现顺序）。
   - 民国 N 年 = 1911+N；只接受「YYYY年…殁」写法自动取卒年，「殁于YYYY年」要显式写 `death`。
   - 非 李代龙谱 的书：inter 顶层加 `"namespace": "zupu-<书的拼音缩写>"`，`branchKey` 也加同样前缀，
     避免与李代龙谱 id 冲突；并先问站长是否另建注册表文件。
3. 构建：`python scripts/lipu/build_lipu_dataset.py <inter.json> --write` → 输出 `modules/genealogy/import/sources/<key>.lipu.data.json`。
   输出里不得出现孤儿（`_orphanFather`）。
4. **单文件 ≤ 45 人**（Vercel 导入超时）。超了用
   `python scripts/lipu/tools/split_branch.py <inter目录> <key> "<newkey>=<房头名,…>:<房名>" …`，
   **一个文件只拆一次、所有组一次给齐、先深后浅**；未载父的散人手工另立文件。拆后重新构建各文件。
5. 校验（全部必须通过）：
   - `python scripts/lipu/tools/fix_living.py --write` 后再跑一次 dry-run，结果 `newly hidden: 0`
   - `python scripts/lipu/tools/check_stubs.py` → dangling 只允许 lichengzhi 的 6 个历史壳节点
   - `python scripts/lipu/tools/dupleaf.py <inter…>` 无输出
6. 注册：`python scripts/lipu/tools/register.py <前一个key> "<key>=<支名>" …`（写 import + LABELS + DATASETS 三处）。
7. `npx tsc --noEmit` 中与 lipu 相关错误为 0。
8. 提交：`git add` 新增/修改的 `*.lipu.data.json` + `lipu-families.ts`，信息格式
   `feat(lipu): <书/卷> 印刷页A-B <支名>…`，推 `onememora HEAD:main`。
9. `python scripts/lipu/tools/tally.py` 记录人数，更新 ledger。

## 5. 隐私与显示（站长 2026-09-27 定的新规）

- **以后全站人名默认全部显示，不脱敏。** 只有本人认领、或自己建追思页时自己选择脱敏，才脱敏显示。
- 数据层照旧**如实标注** `living`（生于 livingCutoff=1940 年及以后且无卒年；或 `presumeLivingFromGen` 以下的无日期后代）。
  这个标记是事实，不要为了"显示全名"去改它或删掉它。
- 当前导入器仍把 `living` 的人建成「仅姓氏、无页面」的节点（`importer.ts` 的 `publicMasked`）。
  改成默认显示全名属于网站代码改动，由站长确认后统一改，**Codex 整理族谱时不要改导入器或显示代码**。
- 永不入库：联系方式、身份证号、住址门牌、电话。书里有也不抄。

## 6. 权限与审核

- 数据集进仓库后由站长在 `/admin/genealogy` 勾选导入；导入失败可「续灌」，可「回滚」整支。
- 导入的追思页归管理员代管、可被家属认领；认领后家属可改名字/生平/关系，系统保留版本。
- 没有测试环境；验收 = 第 4 节全部校验通过 + 本地 tsc 通过 + 推送后后台可见且导入无报错。

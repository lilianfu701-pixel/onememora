# 族谱 / 家谱导入规则

本文件整合 missingu（追思网）把族谱、家谱、历史人物世系导入为可认领追思页的全部规则。
来源无关：Wikidata / CBDB / 纸质族谱 / 手写 fixture 都归一到同一个 `GenealogyDataset`，
下游导入器（`modules/genealogy/import/importer.ts`）不关心来源。

## 1. 核心理念

一次导入**只播种「身份 + 世系」**——名字、粗略生卒、父母/配偶、出处——**不替家属写生平**。
传记、照片、细节留给认领的家属补。规范化的数据形状刻意比一个追思页能承载的更小：
来源只被信任用于身份与世系，其余留白。

## 2. 数据契约（`modules/genealogy/import/types.ts`）

一个数据文件 = 一个 `GenealogyDataset`：

```jsonc
{
  "key": "wikidata:soong",      // 本批次稳定键
  "namespace": "wikidata",      // 去重命名空间（省略则=key）
  "clanName": "吴越钱氏·钱镠支", // 数据集级家族名（可选，套到没有自带 clanName 的人）
  "people": [ /* SourcePerson[] */ ],
  "relations": [ /* SourceRelation[] */ ]
}
```

### SourcePerson（每人）

| 字段 | 必填 | 规则 |
|---|---|---|
| `externalId` | ✅ | 源内稳定 ID（QID / CBDB id / 族谱行键）。关系连线 + 幂等去重都靠它 |
| `name` | ✅ | 主名，用源的文字（中文） |
| `citation` | ✅ | 出处（「谁说的」），是可信度的根 |
| `aliases[]` | | 字 / 号 / 曾用名 → 存为可搜索别名 |
| `gender` | | `male` / `female` / `unknown` |
| `birth` / `death` | | `{ year, month?, day? }`，精度到源真实拥有的（常只有年） |
| `ancestralHometown` | | 祖籍文本 |
| `birthPlace` / `deathPlace` | | `{ country?, region?, city? }` |
| `generationName` | | 字辈 / 派语（如「德」），家族匹配信号，带到图节点 |
| `clanName` | | 家族名（如「陇西李氏·李代龙支系」），显示在姓名前 + 写进标题/描述（利于 SEO 收录、区分同名） |
| `living` | | 在世？见第 4 节。**默认 deceased** |
| `bio` | | 一句话小传 |
| `photoUrl` / `photoCredit` | | 自由授权照片 URL + 署名（仅自由许可才带；fetch 丢弃其余） |

### SourceRelation（只有两种边）

```jsonc
{ "kind": "parent", "parent": "<id>", "child": "<id>" }   // 有向 父→子
{ "kind": "spouse", "a": "<id>", "b": "<id>" }            // 对称 配偶
```

⚠️ **兄弟、祖父、叔伯、堂亲绝不在此声明**——亲属引擎从这两种边**推导**所有其它亲属关系，
所以来源无法断言一条与周围父母矛盾的兄弟边。

## 3. 身份与去重（幂等）

- 一人 = 一页 per **`import:{namespace}:{externalId}`**。
- `namespace` 是去重键：同 namespace + 同 externalId → 单页。
  （蒋中正被宋家和蒋家两次导入时**不重复**。）
- **重导同一源永不重复建页**（靠上面的幂等键）。
- 纸谱 id 格式：`lipu:{branch}:{gen}-{given}`；同代重名自动加 `#1` / `#2` 消歧。
- **跨支共祖**：用 `externalId`（中间 JSON 里的 `externalId` 字段）把这人锚到另一支已导入的
  节点（「上承 X 分支」续接），靠 externalId 去重而非复制一页。

## 4. 隐私 / 在世红线（重要）

- **默认跳过在世者**（`ImportOptions.livingOnly=false` / 首次生产播种只种已故世代）：
  不明确决定就不给任何在世个体建节点；触及被跳过在世者的关系也略去。
- `living: true` → **只建脱敏图节点（仅姓、无公开页）**，绝不建公开追思页。
  **导入近现代世代绝不公开在世者的完整记录。**
- 婚入配偶**保留本姓**（张氏 / 张华珍），只有父系成员才冠族姓。
- 纸谱构建器的在世推定（`build_lipu_dataset.py`，隐私安全）：
  - `livingCutoff`（默认 1940）：有生年无卒年且生年 ≥ cutoff → 标 living。
  - 父辈 20 世纪出生（≥1911）或父辈在世、本人无生无卒 → 推定在世（逐层传播）。
  - `presumeLivingFromGen`：世代 ≥ 此值且无卒年 → 推定在世（整支无日期时的兜底；
    本谱据有日期支推算第 18 代≈1950s，故常设 18）。
  - 旧谱妇女多只记「某氏」：突出为「{夫}之妻」更利识别，原「张氏」留作可搜索别名；
    有全名者（张华珍）保留本名。

## 5. 纸质族谱专用管线（`scripts/lipu/build_lipu_dataset.py`）

```
读图转录 → 手搭中间 JSON（见 scripts/lipu/intermediate.template.json）
   ↓ python scripts/lipu/build_lipu_dataset.py <中间.json>          # dry-run：打印数据集 + 体检报告
   ↓ python scripts/lipu/build_lipu_dataset.py <中间.json> --write  # 存 {branchKey}.lipu.data.json 到 sources/
   ↓ 注册 modules/genealogy/import/sources/lipu-families.ts（import + LABELS + DATASETS 三处都加）
   ↓ npx tsc --noEmit                                               # 本地 0 issues
   ↓ 从 onememora/main 建临时 worktree 拷改动，只 add 相关路径
   ↓ git push onememora HEAD:main                                   # 见第 9 节部署
```

中间 JSON 是**扁平人员表**：每人带自己的本名、**父亲的本名**（由页面上下文中该人唯一出现的那张
名单解析）、配偶、子女名。父亲按 `(gen, father-name)` 连接；只出现在「生：」名单里的叶子
也建节点，保证树完整。字段见模板。

## 6. 质量检查（每批必过）

- **0 孤儿**：每个关系两端都有节点（体检报告会列 `_orphanFather`）。
- living 标记正确（近代后代隐藏、无公开页）。
- 本地 `tsc --noEmit` **0 issues**。
- 导入报告 `ImportReport`：`imported / livingCreated / livingExisting / issues`；
  issue 分 stage（`validate` / `memorial` / `living` / `link` / `photo`）。
- 后台按**真实入库状态**显示已导入 N / 总数（别信脚本自报）。

## 7. 深层 / 大支策略

- gen20/21 起近代后代（全 >1940 隐藏）一律作**叶子**（父 id 直连、无公开页、丢日期无碍），
  只把 <1940 的已故祖先做显式公开节点。
- 无生卒巨型支（如李儒彦）：靠 `presumeLivingFromGen` 划公开线；深层无日期 masses
  （发 X / 恩 X / 厚 X 等）不必逐一建节点，captured 到公开主干 + 一层叶子即可。
- 同名跨房靠叶子机制天然避开路由歧义。

## 8. 多源 + ⚠️ 授权红线

- 四源：Wikidata（名门支）/ zhwiki / **CBDB** / 纸质李代龙谱。
- ⚠️ **CBDB 与 上海图书馆家谱 均为 CC BY-NC-SA 非商业授权**；CBDB 另有独家商业授权给第三方。
  **missingu 有收款属商用 → 需取得商用授权才能抓/扩采**，未决前勿扩。
- 抓取两大坑：
  - `SELECT DISTINCT` 会丢 `VALUES` 约束 → 去 DISTINCT，客户端去重。
  - 血亲双向 BFS 会窜进联姻网 → 改**定向**：祖先只向上、后代只向下、旁系配偶一跳不展开。
  - SPARQL 用 POST 避 414；throttle ~700ms + 退避避 429。

## 9. 部署纪律（关键）

- 代码在 monorepo **`lilianfu701-pixel/onememora`**，子应用 `memorial-platform`。
- **一律 `git push onememora HEAD:main`**（别推 codex 分支；`origin` 是别的仓 GPTlucktime，别推错）。
- **绝不 `git add -A`**（会扫进 `.github/workflows/*`，PAT 无 workflow scope 会被拒），用显式路径 add。
- ⚠️ `global-memorial-platform` worktree 可能**落后 main 数百提交**，别在它上面改推——
  从 `onememora/main` 建**干净临时 worktree** 改，推完 `git worktree remove`。
- ⚠️ 新 missingu Vercel 项目（supportmissingu-6873）**push 不自动部署**（跨账号 webhook）。
  要部署用 Deploy Hook：
  `curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_hf5XzfA2t6uBBIBlz0SOfU2l0rEO/qs5JnhXUXN"`
  （纯文档/脚本改动不影响运行时，可不触发部署。）

## 相关

- 数据契约：`modules/genealogy/import/types.ts`
- 导入器：`modules/genealogy/import/importer.ts`
- 纸谱构建器：`scripts/lipu/build_lipu_dataset.py`
- 中间 JSON 模板：`scripts/lipu/intermediate.template.json`
- 注册表：`modules/genealogy/import/sources/lipu-families.ts`
- 基建/部署：`docs`（及项目记忆 project_missingu_deploy / genealogy_import / genealogy_enrich）

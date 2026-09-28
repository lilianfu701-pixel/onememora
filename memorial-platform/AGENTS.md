# Agent instructions — missingu.org (memorial-platform)

Project context, changelog and conventions: see `CLAUDE.md` in this directory.

## 整理族谱书籍并导入网站

凡是转录纸质族谱 / 家谱书籍、生成族谱数据集、推送到 missingu.org 的工作，
**必须先完整阅读并遵守 [`docs/genealogy-book-import.md`](docs/genealogy-book-import.md)**。

最要紧的几条（细节以该文件为准）：

- 不碰生产数据库；数据只以 `modules/genealogy/import/sources/*.lipu.data.json` 进仓库，站长在后台导入。
- 推送只用 `git push onememora HEAD:main`，只 add 具体路径，禁止 `git add -A`。
- 不虚构父子与生卒；单个数据文件 ≤ 45 人；跨支接树用已存在的 externalId 作锚点。
- 开工前在 `docs/genealogy-ledger.md` 登记页范围，避免与 Claude 重复（Claude 负责李代龙谱第二卷 PDF idx458 往后）。
- 全站人名默认显示不脱敏（站长新规），但 `living` 标记必须如实保留；不要改导入器/显示代码。

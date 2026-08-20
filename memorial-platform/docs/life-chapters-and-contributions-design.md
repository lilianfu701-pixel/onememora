# 人生章节 + 亲友追忆 · 功能设计

> 目标：把「生平」从单一长文，升级为**结构化的人生章节**；并让**亲友补充故事与照片**（经家属审核后）丰富逝者追思页。
> 原则：最大化复用现有内容体系（版本化、审核、媒体管线、权限、审计、搜索），不另起炉灶。

---

## 0. 现状盘点（已有的地基）

| 已有能力 | 位置 | 复用方式 |
|---|---|---|
| 版本化内容 + 审计 | `content_versions` / `content_translations` | 章节正文直接复用（版本、翻译、作者、审计） |
| 内容项发布模型 | `biographies` / `timeline_events` / `tributes`（`status`/`publishedVersionId`/`latestVersion`） | 章节照抄这套「草稿→发布」模式 |
| 访客提交 + 审核 | `visitor_submissions`（`kind`=story/photo、`pending_review`、`audience`、`moderated*`） | 亲友补充直接扩展它 |
| 审核服务 | `moderateSubmission()` | 复用，扩展照片处理 |
| 媒体管线 | `media_assets`（quarantine→scan→ready）+ sharp | 章节配图 / 补充照片复用 |
| 权限 | `canOnMemorial(edit_profile / publish_content / moderate_submission)` | 编辑=edit_profile、发布=publish_content、审核=moderate_submission |
| 审计 / 事务外发 / 搜索 | `auditLogs` / `outboxEvents` / `searchDocuments` | 新内容进审计与搜索索引 |

**缺口**：① 没有「章节」这种结构化内容；② `visitor_submissions.kind="photo"` 有枚举但没有关联到 `media_assets` 的列；③ 媒体没有「归属于某条内容」的通用关联表。

---

## 一、功能一：人生章节（Life Chapters）

### 1.1 章节 = 模板 + 自定义

不做「必填九段」，而是**一套建议章节（可启用/跳过/排序）+ 允许自定义章节**。不是每个人都有事业或婚姻，强制留白反而尴尬。

建议章节目录（代码常量 `LIFE_CHAPTER_TEMPLATE`，用 `chapterKey` 文本 + 代码校验，**不用 pgEnum**，将来加章节不必迁移）：

| chapterKey | 默认标题 | 引导提示语（placeholder，帮家属下笔） |
|---|---|---|
| `childhood` | 童年 | 出生地、家庭背景、儿时趣事、最早的记忆… |
| `student` | 学生时代 | 就读学校、恩师同窗、求学经历、少年志向… |
| `career` | 工作与事业 | 从事的职业、重要成就、职场故事… |
| `marriage` | 结婚与伴侣 | 如何相识、相守岁月、伴侣眼中的他/她… |
| `family` | 家庭 | 子女、手足、家庭生活的点滴… |
| `hobbies` | 兴趣爱好 | 热爱的事物、擅长的手艺、旅行、收藏… |
| `faith` | 信仰 | 宗教信仰、精神寄托、践行的信念… |
| `values` | 格言与座右铭 | 常挂在嘴边的话、人生信条… |
| `parenting` | 教育子女 | 如何言传身教、留给后辈的家风… |
| `later_years` | 晚年生活 | 退休后的日子、颐养天年的时光… |
| `meaning` | 人生意义 | 家人眼中，这一生留下了什么… |
| `custom` | （家属自填） | 自由主题 |

> 提示语是重要 UX：很多家属面对空白框不知写什么，逐段引导能显著提高完成度。

**与旧 `biography` 的关系（建议 B 方案）**：`biography` 保留为追思页顶部的**简短生平/悼词**（可留空）；人生章节是主体的、结构化的深度内容。改动最小、层次清晰。（备选 A：章节完全取代生平——见第七节决策。）

### 1.2 数据模型

新增表 `life_chapters`（沿用 `tributes`/`timeline_events` 的形态）：

```
life_chapters
  id                uuid pk
  memorial_id       uuid → memorials (cascade)
  chapter_key       text            -- 模板键或 'custom'，代码校验
  custom_title      text null       -- 自定义标题，或对模板标题的覆盖
  display_order     integer         -- 排序
  status            content_status  -- draft / published / hidden（复用现有枚举）
  published_version_id uuid → content_versions null
  latest_version    integer default 0
  cover_media_id    uuid → media_assets null   -- 章节封面图（可选）
  created_at / deleted_at
  unique(memorial_id, chapter_key) where chapter_key <> 'custom'
```

- 正文**不**存本表，存 `content_versions`：需要给 `content_type` 枚举**增加 `"life_chapter"`**（一次 `ALTER TYPE ADD VALUE` 迁移）。这样版本历史、翻译、作者、审计全部免费复用。
- 章节配图用下方通用关联表。

新增通用媒体关联表 `content_media`（章节配图、补充照片共用；用 `owner_type` 文本避免枚举迁移）：

```
content_media
  id            uuid pk
  owner_type    text        -- 'life_chapter' | 'contribution' | 'tribute'
  owner_id      uuid        -- 对应内容行 id
  media_id      uuid → media_assets (cascade)
  role          text        -- 'gallery' | 'cover' 等
  display_order integer
  caption       text null
  created_at
  index(owner_type, owner_id)
```

### 1.3 服务与 API（`modules/memorials/life-chapters.ts`）

照抄 biography 的版本+发布模式：

| 函数 | 说明 | 权限 |
|---|---|---|
| `listChapters(memorialId, {includeDrafts})` | 公开取已发布；管理取全部 | 读 |
| `addChapter(actor, memorialId, chapterKey\|custom)` | 从模板或自定义新建（草稿） | edit_profile |
| `saveChapter(actor, chapterId, {title?, body, sourceLocale})` | 追加 `content_versions` 版本 | edit_profile |
| `publishChapter(actor, chapterId)` | 把最新版设为公开版 | publish_content |
| `reorderChapters(actor, memorialId, orderedIds[])` | 更新 display_order | edit_profile |
| `removeChapter(actor, chapterId)` | 软删除 | edit_profile |
| `attachChapterMedia / detachChapterMedia` | 复用媒体 sign 流程写 `content_media` | edit_profile |

REST（沿用现有风格）：
```
GET   /api/memorials/[id]/chapters
POST  /api/memorials/[id]/chapters                 新建
PUT   /api/memorials/[id]/chapters/[chapterId]     存草稿
POST  /api/memorials/[id]/chapters/[chapterId]/publish
POST  /api/memorials/[id]/chapters/reorder
DELETE/api/memorials/[id]/chapters/[chapterId]
POST  /api/memorials/[id]/chapters/[chapterId]/media
```

### 1.4 公开页渲染（Lumina · editorial 长文）

追思页新增「人生章节」区，按 `display_order` 渲染**已发布**章节：

- 每章：阶段 eyebrow（小标签/图标）+ serif 标题 + 正文（衬线、留白充足）+ 配图小画廊 + 可选封面图
- 长者可加**章节跳转导航**（sticky 目录），点击滚动到对应章节
- 章节下方内联「亲友补充」小卡（见功能二 3.5）

### 1.5 管理页编辑（`/manage`）

「人生章节」编辑器：
- 章节列表（已启用）+「+ 添加章节」（从剩余模板键或自定义中选）
- 每章卡片：标题、带**提示语 placeholder** 的 textarea、配图上传（复用 `PhotoManager` 的 sign 流程）、拖拽排序、`存草稿` / `发布`
- 顶部「一键全部发布」便捷操作

---

## 二、功能二：亲友追忆（Contributions）

### 2.1 定位：三层内容各司其职

| 层 | 内容 | 时效 | 是否审核 |
|---|---|---|---|
| 留言簿（现有 Guestbook） | 一句话悼念 | 即时展示 | 否（家属可事后隐藏） |
| **亲友追忆（本功能）** | 故事 + 照片，可挂到某人生章节 | **审核后展示** | 是 |
| 家属长文 tributes（现有） | 家属/受邀者的长篇追忆 | 发布制 | — |

### 2.2 数据模型（扩展 `visitor_submissions`，不新建平行表）

`visitor_submissions` 的语义正是「访客提交的一段故事或一张照片」，直接扩展：

复用：`kind`(story/photo)、`status=pending_review`、`audience`、`moderated_by/at/note`、`submitter_user_id`、`source_locale`。

新增列：
```
contributor_name      text null    -- 署名（未登录或自选显示名）
contributor_relation  text null    -- 与逝者关系：挚友/同事/学生/儿媳…（公开页显示「—— 同事·王明」）
chapter_id            uuid null → life_chapters   -- 可选：把这条补充挂到某个人生章节
```
照片：写 `content_media(owner_type='contribution', owner_id=submissionId, ...)`。
（一条补充 = 一段文字（可短）+ 0..N 张照片；纯照片也要求填一句说明作为 body/caption。）

### 2.3 提交流程

- **谁能补充**（建议）：默认**登录用户**（有署名+关系，便于问责）；家属可在设置里开启**游客文字补充**（限流，同留言簿匿名票思路）；**照片一律需登录**（媒体问责）。
- 照片上传走 quarantine（未审核前不公开）；家属通过后，随该 submission 一并可见。
- 提交成功 → `pending_review`，前端提示「已提交，家属审核后展示」。

### 2.4 审核（家属后台 `/manage`）

- 新增「亲友补充」待审队列：故事文本 + 照片缩略图预览，`通过` / `拒绝`（+备注）
- 复用 `moderateSubmission()`，扩展：通过 photo 类时提升其关联 `media_assets` 的可见性
- 有新补充时经 `outbox` 通知家属（提醒进管理页）

### 2.5 公开页渲染

- 独立「亲友追忆」区：已通过的故事 + 照片 + 「—— 关系·姓名」，按时间/精选排序
- 挂到章节的补充：在**对应人生章节下**以「亲友补充」小卡呈现，让章节内容由亲友共同织成

---

## 三、隐私 · 安全 · 审计（沿用现有不变量）

- 待审内容对公众**不可见**；被拒内容留档、永不外显；访问不确认存在性（invite-only 返回 404 的同理）
- 媒体：禁 SVG、magic-byte 校验、EXIF/GPS 剥离、服务端生成 key——全部沿用；**未通过审核的照片不可公开**
- 审计：章节存/发、补充建/审 全部写 `auditLogs`
- 搜索：**已发布**章节 + **已通过**补充经 `outbox`（`search.index`）进 `searchDocuments`，让内容可被检索

---

## 四、国际化（i18n）

- 章节**默认标题 + 提示语** 需 15 语言（`messages/*.json` 新命名空间，如 `lifeChapters`）
- 正文按**源语言**展示（家属用自己的语言写）；逐段多语言翻译走既有 `content_translations` 管线，MVP 暂不做
- 新增 UI 文案：管理编辑器、公开区标题、补充表单、审核队列

---

## 五、分期实施建议

| 阶段 | 范围 |
|---|---|
| **Phase 1 · 章节 MVP** | `life_chapters` 表 + `content_media` 表 + `content_type` 加 `life_chapter`；模板/提示语常量；管理编辑器（先文字，再配图）；公开渲染；草稿/发布流。暂不做逐章翻译。 |
| **Phase 2 · 补充 MVP** | 扩展 `visitor_submissions`（contributor_name/relation、chapter_id）+ 照片关联；补充表单（故事+照片）；家属审核队列；公开「亲友追忆」区 + 章节内挂载。 |
| **Phase 3 · 打磨** | 章节跳转导航、拖拽排序、逐章翻译、家属新补充通知、游客补充开关、点赞/献花等互动。 |

---

## 六、关键决策（已确认 2026-08-20）

1. **章节 vs 旧生平** → ✅ `biography` 保留为顶部简短生平/悼词，人生章节为主体。
2. **信仰 / 格言 / 教育子女** → ✅ 拆成 3 个独立可选章节（faith / values / parenting），家属按需启用。
3. **亲友补充游客权限** → ✅ 文字可游客 + 限流，照片需登录。
4. **补充落表方式** → ✅ 扩展 `visitor_submissions`（复用审核队列）。
5. **逐章多语言翻译** → ✅ MVP 只源语言，翻译后置。
6. **实施顺序** → ✅ 先做**人生章节 Phase 1**（表 + 模板 + 编辑器 + 发布 + 公开渲染，先文字后配图）。

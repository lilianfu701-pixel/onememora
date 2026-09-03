# Memorial Platform — missingu.org

Global memorial platform for families to create, manage, and share digital memorials.

## 功能清单 / Changelog (2026-09 交付，均已上线 missingu.org)

按交付顺序，每项含关键位置/迁移/状态。部署：改代码 push 到 `onememora/main` 触发 Vercel（本地工作分支 `codex/global-memorial-platform`）。本地 dev 用本机 Postgres（`localhost/memorial_dev`），与生产 Supabase **各自迁移**。

1. **创建追思页表单改版** — 生辰/忌日横向窄框一行、国家默认 CN、逝世年默认当年、祖籍缩窄、「社会关系」「添加逝者的」文案、**遗像上传**。`app/[locale]/memorials/new/create-form.tsx`。
2. **纯数字追思页编号(8位) + 编号搜索** — `memorials.public_number`（随机非顺序，唯一，迁移0047回填）；首页/搜索输入编号直达；追思页展示编号。`modules/memorials/slug.ts`、`service.ts`。
3. **收件箱分「个人消息/系统消息」** — 按 `fromSystem` 两标签+未读徽标。`app/[locale]/inbox/inbox-view.tsx`。
4. **系统消息 15 语言本地化** — `messages.template_key`+`template_params`(迁移0048)，收件箱页按 locale 渲染，`sysmsg` 命名空间。
5. **讣告独立化** — 首页入口「发布讣告」+ `/[locale]/obituary/new`（新建自动建追思页/关联已有预填）；管理页移除内嵌编辑器改为链接；讣告全文+海报带追思页编号。见 [[project_missingu_obituary]]。
6. **管理员转让 + 失联接管 + 参与** — `memorial_takeover_requests`(迁移0049/0050 加 `kind` takeover|join)；页脚显示管理员+申请接管(通知→30天超时升级 `openOwnershipDispute` 仲裁)+申请参与(加为 editor)；`modules/memorials/ownership.ts`。见 [[project_missingu_ownership]]。
7. **PayPal 支付正式上线** — 真实收款跑通（¥9.9 实测捕获+记账）。生产 env：`PAYPAL_CLIENT_ID/SECRET/WEBHOOK_ID` + `PAYPAL_ENV=live`。见 [[project_missingu_payment_stripe]]。
8. **后台收款对账清晰化** — `/admin/orders`：状态中文化、成功/未完成/失败分卡、**各家属账户余额表**、CSV。`modules/offerings/orders-admin.ts`。
9. **登录回跳修复** — Google OAuth 带 `next` 返回原页 + 锁语言（不再落 /en 首页）。`app/api/auth/oauth/google/*`。
10. **首页/搜索合并为一个搜索框** — 姓名或 8 位编号（纯数字自动识别为编号直达）；搜索结果每条一行 **姓名·生卒·逝世地区**。`app/[locale]/page.tsx`、`search/page.tsx`、`modules/search/query.ts`。
11. **定时 email 提醒** — 每日扫描：祭日(家属+关注者) + 清明/中元(中文界面用户)，提前3天+当天各一封，幂等去重；🔔 关注按钮 + 一键退订；`modules/reminders/`(迁移0051)；生产已激活(`ANNIVERSARY_NOTIFICATIONS_ENABLED=true` + `EMAIL_PROVIDER=resend`)。⚠️ 清明/中元日期表 festivals.ts 排到 2032，到期续。见 [[project_missingu_reminders]]。
12. **杂项微调** — 花圈挽联飘带间距+上移；创建页各处文案。

> [[...]] 指向 `~/.claude/.../memory/project_missingu_*.md` 备忘（含每项的踩坑与实现细节）。

## Quick Reference

```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (unit + integration)
npm run test:e2e     # Playwright
npm run db:generate  # Drizzle Kit generate migrations
npm run db:migrate   # Drizzle Kit run migrations
npm run db:seed      # Seed religions, plans, features
npm run worker       # Background job processor
```

## Stack

- **Runtime**: Node >= 22.13.0, TypeScript 5.9 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Framework**: Next.js 16.2.12 (App Router, `force-dynamic` pages, `after()` for post-response work), React 19
- **Database**: PostgreSQL 17 via Drizzle ORM 0.45.2 + `pg` driver
- **Auth**: Email/phone OTP + Google/Apple OAuth, HMAC-SHA256 sessions via `jose`
- **i18n**: next-intl 4.13.4, 15 locales, locale always in URL path
- **Media**: S3-compatible object storage (`@aws-sdk/client-s3`), sharp for image processing
- **Validation**: Zod 4.1.12
- **Cache/Rate-limit**: ioredis 5.8.1 (optional)
- **Tests**: Vitest 4.1.10 (unit + integration), Playwright 1.56.1 (e2e)
- **Deploy**: Vercel (Hobby) + Supabase (ca-central-1) + Cloudflare DNS

## Project Structure

```
app/                    Next.js App Router
  [locale]/             Locale-prefixed pages
    memorials/          Memorial CRUD, view, manage
    search/             Public search
    sign-in/            Auth flow
    admin/              Admin panel
  api/                  API routes (see below)
db/
  schema/               Drizzle table definitions by domain
  seed/                 Seed data (religions, plans, features)
  client.ts             Lazy Pool, SSL auto-detect
drizzle/                Generated SQL migrations (0000–0019)
i18n/                   next-intl routing + request config
lib/                    Shared utilities (env, errors, crypto, logger, result, feature-flags)
messages/               15 locale JSON files
modules/                Domain modules (see below)
scripts/                Operational scripts (backup verification)
tests/                  unit/, integration/, e2e/
worker/                 Background job processor
```

## Domain Modules (`modules/`)

| Module | Purpose |
|--------|---------|
| `auth/` | Email/phone OTP, OAuth (Google/Apple), sessions, cookies |
| `media/` | Presigned upload, quarantine→scan→promote pipeline, S3/InMemory adapters, sharp image processing |
| `memorials/` | Memorial CRUD, access control, content versioning, privacy, export, invitations, SEO, slugs |
| `permissions/` | Pure allow-list policy: `canOnMemorial()` + `canGovern()` |
| `religion/` | Religion/culture catalog, ritual definitions, calendar adapters, anniversary computation |
| `commemorations/` | Visitor acts of remembrance, rate limiting |
| `genealogy/` | Family tree: people, links, double-blind matching, tree traversal |
| `memorials/recognition.ts` | Recognition claim lifecycle: create, decide (confirm/reject), withdraw, escalate, list pending |
| `governance/` | Moderation cases, ownership disputes, memorial merging, reports |
| `search/` | Text search, indexing, duplicate detection |
| `entitlements/` | Plan-based + per-memorial feature resolution |
| `outbox/` | Transactional outbox: claim (SKIP LOCKED), dispatch, backoff, dead letters |
| `audit/` | Read-only audit trail queries |
| `observability/` | Health/readiness probes |

## Database Schema (Drizzle)

Tables organized in `db/schema/` by domain file:

- **system.ts** — `auditLogs`, `outboxEvents`
- **identity.ts** — `users`, `userIdentities`, `emailCredentials`, `phoneCredentials`, `loginChallenges`, `loginAttempts`, `sessions`
- **memorial.ts** — `deceasedPeople`, `memorials`, `memorialNames`, `memorialLocations`, `memorialMembers`, `relationshipClaims`, `recognitionClaims`, `memorialInvitations`, `exportJobs`, `relationshipTypes`
- **content.ts** — `contentVersions`, `contentTranslations`, `biographies`, `timelineEvents`, `tributes`, `visitorSubmissions`
- **media.ts** — `mediaAssets`, `mediaVariants`
- **religion.ts** — `religions`, `denominations`, `culturalTraditions`, `ritualDefinitions`, `ritualVersions`, `ritualSources`, `ritualTranslations`, `ritualCompatibilityRules`
- **commemoration.ts** — `memorialRitualSettings`, `commemorations`, `commemorationMessages`, `anniversaryReminders`
- **governance.ts** — `blockedUsers`, `reports`, `moderationCases`, `moderationActions`, `ownershipDisputes`, `disputeEvidence`, `memorialSlugRedirects`
- **search.ts** — `searchDocuments`, `duplicateCandidates`
- **commerce.ts** — `features`, `plans`, `planEntitlements`, `subscriptions`, `orders`, `memorialEntitlements`
- **genealogy.ts** — `familyPeople`, `familyLinks` (+ `dissolvedAt`/`dissolutionReason` for ex-partner edges), `familyMatchSuggestions`

## API Routes

### Auth
- `POST /api/auth/email/request` — send OTP
- `POST /api/auth/email/verify` — verify OTP, create session
- `POST /api/auth/phone/request` — phone OTP (feature-gated)
- `POST /api/auth/phone/verify` — verify phone OTP
- `POST /api/auth/sign-out` — revoke session

### Memorials
- `POST /api/memorials` — create memorial
- `PUT /api/memorials/[id]/biography` — save draft
- `POST /api/memorials/[id]/biography/publish` — publish biography
- `POST /api/memorials/[id]/publish` — publish memorial
- `PATCH /api/memorials/[id]/privacy` — update visibility
- `POST /api/memorials/[id]/commemorations` — create commemoration
- `GET|PUT /api/memorials/[id]/ritual-settings` — ritual configuration
- `GET /api/memorials/[id]/rituals` — available rituals
- `POST /api/memorials/[id]/members/invitations` — send invitation
- `POST|DELETE /api/memorials/[id]/export` — data export
- `GET|POST /api/memorials/[id]/family` — family tree association
- `GET|PUT /api/memorials/[id]/relatives` — display relatives list (cardinality-enforced: father/mother/husband/wife max 1 each; siblings/children unlimited; ex_husband/ex_wife unlimited)
- `GET|POST /api/memorials/[id]/recognition-claims` — list pending claims / submit a recognition claim
- `POST /api/memorials/[id]/recognition-claims/[claimId]` — decide a claim (confirmed/rejected/withdrawn)

### Media
- `POST /api/media/sign` — presigned upload URL
- `POST /api/media/[id]/complete` — mark upload complete
- `GET /api/media/[id]` — asset status + URL
- `DELETE /api/media/[id]` — soft delete

### Other
- `GET /api/search` — public search
- `POST /api/reports` — submit report
- `GET|POST /api/family/links` — family links
- `POST /api/family/links/[id]` — confirm/reject link
- `POST /api/family/people` — add person to graph
- `GET /api/family/suggestions` — match suggestions
- `POST /api/family/suggestions/[id]` — accept/decline match
- `GET /api/health` — liveness
- `GET /api/health/ready` — readiness (DB + migrations)
- `GET /api/cron/daily` — anniversary reminders + purge (CRON_SECRET)
- `GET /api/cron/outbox` — outbox drain (CRON_SECRET)

## i18n

15 locales: `en`, `zh-CN`, `zh-TW`, `zh-HK`, `es`, `pt-BR`, `pt-PT`, `fr`, `de`, `ar`, `ja`, `ru`, `id`, `vi`, `ko`

- Default: `en`. Launch quality: `en`, `zh-CN`, `es`.
- RTL: `ar` only.
- Locale always in URL path (`localePrefix: "always"`).
- Messages in `messages/{locale}.json`. Top-level keys: `meta`, `common`, `nav`, `home`, `auth`, `memorial`, `privacy`, `religion`, `ritual`, `moderation`, `errors`, `a11y`, `search`.

## Media Pipeline

Upload flow: `signUpload` → presigned PUT URL → client uploads to quarantine prefix → `markUploadComplete` (status `scanning`, publishes `media.process` outbox event) → `processUploadedAsset` (verify magic bytes + re-encode via sharp + promote to ready prefix) → `addressFor` (public or signed read URL).

Security invariants:
- SVG excluded (XSS vector)
- EXIF/GPS stripping via sharp `.rotate()` + re-encode (not just metadata strip)
- Object keys from server UUIDs only (no client filename in key)
- Signed read URLs: 5-min TTL
- Public URLs only for ready assets on public memorials
- Magic-byte signature verification (`signatureMatchesDeclared`)
- Sharp re-encode replaces malware scanner on image path (decode to pixels + re-encode = sanitization)
- Video/audio disabled at launch (require AV scanner)
- Error responses never contain storage keys

Storage adapters: `S3MediaStorage` (production) and `InMemoryMediaStorage` (dev/test). Factory in `mediaStorage()` auto-selects based on env vars.

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `APP_URL` | yes | Base URL (https) |
| `SESSION_SECRET` | yes | Min 32 chars, HMAC key |
| `DATABASE_URL` | yes | postgres:// connection string |
| `REDIS_URL` | no | Rate limiting, caching |
| `S3_BUCKET` | no* | Object storage bucket |
| `S3_REGION` | no* | S3 region |
| `S3_ACCESS_KEY_ID` | no* | S3 credentials |
| `S3_SECRET_ACCESS_KEY` | no* | S3 credentials |
| `S3_ENDPOINT` | no | Custom endpoint (R2, MinIO) |
| `S3_FORCE_PATH_STYLE` | no | `true` for R2/MinIO |
| `S3_PUBLIC_BASE_URL` | no | CDN base for public media |
| `EMAIL_PROVIDER` | no | Default: `console` |
| `SMS_PROVIDER` | no | Default: `console` |
| `CRON_SECRET` | no | Bearer token for cron routes |
| `GOOGLE_CLIENT_ID/SECRET` | no | Google OAuth |
| `APPLE_CLIENT_ID/PRIVATE_KEY` | no | Apple OAuth |
| `PHONE_AUTH_ENABLED` | no | Default: `false` |
| `PHONE_AUTH_REGIONS` | no | Comma-separated ISO codes |
| `ANNIVERSARY_NOTIFICATIONS_ENABLED` | no | Default: `false` |

*S3 vars required in production for media uploads.

## Worker

Entry: `worker/index.ts` (`npm run worker`). Processes:
- **Outbox drain** — continuous, claim with `FOR UPDATE SKIP LOCKED`
- **Anniversary reminders** — every 5 min
- **Memorial purge** — every hour
- **Depth report** — every minute

Outbox handler topics: `search.index`, `search.remove`, `memorial.created`, `memorial.published`, `memorial.privacy_changed`, `media.process`.

On Vercel: outbox drain and daily jobs run via cron (`vercel.json`), not the standalone worker.

## Relatives System

Display-layer relatives (`memorial_relatives`) are free-text rows shown on the memorial page. They are separate from the graph-based genealogy (`familyPeople`/`familyLinks`).

### Cardinality rules (enforced in UI + server-side PUT)

| Relationship | Max count | Note |
|---|---|---|
| `father`, `mother` | 1 each | Biological/primary parents |
| `paternal_grandfather`, `paternal_grandmother` | 1 each | Father's parents |
| `maternal_grandfather`, `maternal_grandmother` | 1 each | Mother's parents |
| `husband`, `wife` | 1 each | Current spouse |
| `ex_husband`, `ex_wife` | unlimited | Multiple prior marriages allowed |
| `son`, `daughter` | unlimited | |
| `older_brother`, `younger_brother`, `older_sister`, `younger_sister` | unlimited | |

The `MAX_ONE` set is defined as a `ReadonlySet<string>` constant in both `relatives-editor.tsx` and `create-form.tsx`. The same set is duplicated in the PUT route for server-side enforcement. Keep all three in sync when adding new unique-relationship types.

### Recognition claim system (三层认亲机制)

When a registered user finds they've been listed as a relative, they can submit a recognition claim:

- **Tier 1 (day 0):** Claim recorded as `pending`; memorial owner notified.
- **Tier 2 (day 7, 14):** Automatic reminder notifications (via outbox, not yet wired).
- **Tier 3 (day 30+):** Claimant may request platform arbitration (`escalated` status).
- Auto-approval **never** happens — a confirmed link grants family-graph traversal rights.

Service: `modules/memorials/recognition.ts`. Status enum: `pending → escalated → confirmed | rejected | withdrawn`.

### Ex-spouse in the family graph

Ex-spouses are represented as `partner` edges in `familyLinks` with `dissolvedAt` + `dissolutionReason` set. A CHECK constraint (`family_links_dissolution_ck`) ensures these columns are null on non-partner edges. Children from previous marriages need no special type — existing `parent` edges represent biological parentage.

## Architectural Patterns

- **Result type** — services return `Result<T, E>` (discriminated union), not throws, for business failures
- **Error codes** — 18 stable codes with fixed HTTP status mappings; messages never from caller input
- **Transactional outbox** — events committed in same DB transaction as business changes; exponential backoff; max 5 attempts; dead-letter
- **Permissions** — pure allow-list functions, no middleware magic: `canOnMemorial(actor, role, action)` + `canGovern(actor, action)`
- **Access control** — invite-only memorials return 404 (not 403) to prevent existence confirmation
- **Content versioning** — immutable `contentVersions` rows; biography has `publishedVersionId` + `latestVersion`
- **Structured logging** — JSON per line, key-based redaction (passwords, tokens, emails, phones)
- **Crypto** — HKDF from SESSION_SECRET with purpose separation; timing-safe comparison
- **Feature flags** — derived from env at startup (`lib/feature-flags.ts`)

## Testing

- **Unit** (17 suites in `tests/unit/`) — run in parallel
- **Integration** (19 suites in `tests/integration/`) — run sequentially, share one PostgreSQL + Redis
- **E2E** (8 specs in `tests/e2e/`) — Playwright, Chromium, port 3100

Vitest env from `.env.test`. Playwright starts dev server automatically.

## Deployment

- **Git**: `lilianfu701-pixel/onememora` on GitHub, branch `codex/global-memorial-platform`
- **Vercel**: push to `main` triggers deploy
- **Supabase**: PostgreSQL in `ca-central-1`
- **Cloudflare**: DNS for missingu.org
- **Cron**: daily at 04:00 UTC (anniversaries + purge), 04:20 UTC (outbox)

## Security Checklist

- Session tokens: HMAC-SHA256, httpOnly, secure, sameSite=lax
- OTP: hashed before storage, max 3 attempts, 10-min expiry, lockout
- CSRF: POST-only mutations, sameSite cookies
- Headers: HSTS, X-Frame-Options DENY, nosniff, strict Referrer-Policy, Permissions-Policy
- Media: no SVG, magic-byte check, EXIF strip, server-generated keys only
- Audit: append-only log for all state changes
- Env: validated at startup via Zod; missing secrets fail closed
- Errors: codes only, never echo internal state or storage keys

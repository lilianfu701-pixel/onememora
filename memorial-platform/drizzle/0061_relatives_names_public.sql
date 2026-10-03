-- Site policy (2026-09): names are shown in full by default.
-- Before 0060 every living relative was stored as 'family' by default, so the
-- stored value cannot tell a default from a choice; the site owner decided to
-- make all of them public. 'hidden' rows (always an explicit choice) and each
-- person's own users.name_visibility (which overrides these rows) are untouched.
UPDATE "memorial_relatives"
SET "name_visibility" = 'public', "show_full_name" = true
WHERE "name_visibility" = 'family';

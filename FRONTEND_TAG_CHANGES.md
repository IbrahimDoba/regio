# Frontend Changes Required — Tag Localization

> Delete this file once changes are implemented.

The backend tag system has been overhauled. Tags now have a **canonical English name**
(`name`) used for storage and API submission, and a **localized display label** (`label`)
returned per request language. This affects autocomplete, feed filtering, listing
creation/editing, and type definitions.

---

## 1. `src/lib/api/types.ts`

### `TagAutocomplete` — add `label`

The autocomplete endpoint (`GET /listings/tags`) now returns both fields:

```ts
// Before
interface TagAutocomplete {
  id: number;
  name: string;       // was the localized display name — now it's canonical English
  is_official: boolean;
}

// After
interface TagAutocomplete {
  id: number;
  name: string;       // canonical English — submit this to the API when creating/filtering
  label: string;      // localized display name — show this in the UI
  is_official: boolean;
}
```

---

## 2. `src/lib/api/modules/listings.ts`

### `searchTags` return type

Update the return type from `TagAutocomplete[]` to reflect the new shape above.
No other change needed — the endpoint and params are unchanged.

---

## 3. `src/components/feed/FilterPanel.tsx`

Two things to fix here:

### a) Dropdown — show `label`, not `name`

In the tag suggestion dropdown (around line 149–159), the text rendered for each
suggestion should use `tag.label` (localized) not `tag.name` (canonical English).

### b) Selection — store `name` for API, `label` for display

`handleSelectTag()` (around line 93–99) currently pushes the tag string into
`stagedTags`. With the new system you need to track both:

- **Submit** `tag.name` to the API (the feed `tags` filter param)
- **Display** `tag.label` in the selected-tag pills

The simplest approach: change `stagedTags` from `string[]` to
`TagAutocomplete[]` (objects), render `tag.label` in pills, and pass
`stagedTags.map(t => t.name)` wherever you send tags to the API.

The existing duplicate-prevention filter (line 62) should compare by `tag.name`
(canonical) to avoid the same concept being added twice under different language
labels.

---

## 4. `src/app/(app)/page.tsx`

If you change `stagedTags` to `TagAutocomplete[]` as described above, update
line 112 where tags are spread into feed params:

```ts
// Before
...(stagedTags.length > 0 ? { tags: stagedTags } : {})

// After
...(stagedTags.length > 0 ? { tags: stagedTags.map(t => t.name) } : {})
```

State initialisation, `addTag`, and `removeTag` helpers and props passed to
`FilterPanel` (lines 120–121, 150–152) will also need updating if `stagedTags`
becomes `TagAutocomplete[]`.

---

## 5. `src/components/modals/CreateModal.tsx` and `EditModal.tsx`

These modals currently use a **free-text** tag input (type + Enter/comma to add,
around lines 133–142 in CreateModal, 217–226 in EditModal). This worked before
because the backend accepted any string. Now official tags must be submitted
using their canonical English `name`, which means free-text entry will miss
official tags unless the user happens to type the exact English canonical string.

**Recommended fix:** wire the tag input up to `useSearchTags` (already used in
`FilterPanel`) to show autocomplete suggestions as the user types. On selecting
a suggestion, push `tag.name` into the `tags` state and show `tag.label` in the
pill. For unknown strings typed and confirmed (unofficial tags), push the raw
string as-is — the backend accepts these and creates a pending unofficial tag.

The payload line (`tags` in the `ListingCreate` / `ListingUpdate` body) is
already correct — it sends `tags` as `string[]`. Just make sure those strings
are canonical names (from `tag.name`) for official tags.

**No changes needed for:**
- `PreviewModal.tsx` — it displays `listing.tags: string[]` which the API now
  returns as localized labels. It will show correctly without changes.
- `src/app/admin/tags/page.tsx` — uses the admin endpoint which has its own
  schema (`TagAdminView` with `name`, `name_de`, `name_en`, `name_hu`,
  `usage_count`). No changes required.

---

## Summary

| File | Change |
|---|---|
| `types.ts` — `TagAutocomplete` | Add `label: string` |
| `modules/listings.ts` — `searchTags` | Update return type |
| `FilterPanel.tsx` | Show `tag.label` in dropdown; store `TagAutocomplete` objects in `stagedTags` |
| `page.tsx` | Pass `stagedTags.map(t => t.name)` to feed API |
| `CreateModal.tsx` / `EditModal.tsx` | Replace free-text input with autocomplete; submit `tag.name` for official tags |
| `PreviewModal.tsx` | No change needed |
| `admin/tags/page.tsx` | No change needed |

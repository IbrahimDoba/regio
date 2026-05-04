# Feed Filters — Frontend Implementation Guide

This document covers the **tag filter** and **radius filter** additions to the listing feed.

---

## Tag Filter

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/listings/tags?q=<query>&lang=<lang>` | Autocomplete — returns up to 10 matching tags in the given language |
| `GET` | `/listings/feed?tags=<name>&tags=<name>` | Feed — filter by one or more tags |

### How it works

Tags on listings are stored as a flat string array (e.g. `["vegan", "bio", "handmade"]`). The feed filter is **AND logic** — passing multiple tags returns listings that have all of them.

**Important:** The backend does not validate that tag strings sent to `/feed` exist in the database. Enforcement is entirely on the frontend — the UI must only allow users to select tags surfaced by the autocomplete, never free-text input.

### Recommended UX

Since the feed already has a text search input, the cleanest approach is a **unified filter bar** — one input that handles both text search and tag selection:

1. As the user types (debounced ~300ms), call `GET /listings/tags?q=<input>&lang=<current_display_lang>` and show matching tags as autocomplete suggestions in a dropdown — tags are matched against their localized name for that language, so a German user typing "gemüse" will find the right tag
2. Selecting a tag from the dropdown adds it as a removable chip and clears the input (ready for more tags or free-text)
3. The user can mix chips and a text query freely before submitting
4. A **radius dropdown** (the 6 options below) sits alongside the input as a secondary control — user picks a value and it stages alongside the other filters
5. **The feed is only re-fetched when the user presses Enter or clicks the Search button** — not on each chip change or radius selection
6. Do not allow free-text tag submission — only autocomplete selections are valid tags

This avoids multiple competing inputs, reduces unnecessary requests, and gives the user control over when the search fires — particularly important on slower connections or mobile.

### Example requests

```
GET /listings/tags?q=veg&lang=en
→ [{ "id": 3, "name": "vegan", "is_official": true }, ...]

GET /listings/tags?q=gem&lang=de
→ [{ "id": 12, "name": "Gemüse", "is_official": true }, ...]

GET /listings/feed?tags=vegan&tags=bio
→ listings that have both "vegan" AND "bio"

GET /listings/feed?tags=handmade&categories=OFFER_PRODUCT&radius=25km
→ all filters compose freely
```

---

## Radius Filter

A `radius` query param has been added to `GET /listings/feed`. It filters by the reach the **seller** set on their listing, not the viewer's location — i.e. "show me listings whose seller operates within X km."

### Accepted values

| Value | Meaning |
|------------|----------------------------------|
| `5km` | Listings with reach up to 5 km |
| `10km` | Listings with reach up to 10 km |
| `25km` | Listings with reach up to 25 km |
| `50km` | Listings with reach up to 50 km |
| `100km` | Listings with reach up to 100 km |
| `nationwide` | No radius constraint |

Omitting the param entirely is equivalent to `nationwide`. Any value outside this list returns `422`.

### Example requests

```
GET /listings/feed?radius=10km
GET /listings/feed?radius=50km&categories=OFFER_SERVICE
GET /listings/feed?radius=nationwide
GET /listings/feed              ← no filter applied
```

### Suggested UX

A dropdown or segmented control with the 6 options above. "All" / no selection = omit the param. Selection is staged alongside other filters and sent only when the user confirms the search.

---

## All filters together

All params on `/listings/feed` are optional and compose freely:

| Param | Type | Example |
|------------|------|---------|
| `categories` | repeated string | `?categories=OFFER_SERVICE&categories=REQUEST` |
| `tags` | repeated string | `?tags=vegan&tags=bio` |
| `radius` | enum string | `?radius=25km` |
| `q` | string | `?q=guitar+lessons` |
| `lang` | string | `?lang=de` — controls localized content on `/feed` and tag name matching on `/tags` |
| `offset` | integer | `?offset=20` |

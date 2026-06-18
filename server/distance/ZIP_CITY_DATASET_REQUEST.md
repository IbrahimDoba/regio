# ZIP ↔ City Validation — Dataset Request

To enforce that a user's entered city matches their ZIP code (and vice versa),
we need the **Magyar Posta irányítószám** (Hungarian postal code) reference dataset.

## What we need

A complete mapping of every Hungarian ZIP code to the city/village name(s) it covers.
Note: a single ZIP code can cover multiple settlements.

## Requested format

A UTF-8 CSV file with a semicolon delimiter, one row per city per ZIP code:

```
zip_code;city_name
1011;Budapest
1012;Budapest
7300;Komló
7304;Hegyhátmaróc
7304;Magyarszék
```

No header row variations, no extra columns, no BOM — just these two fields.
This maps directly into a new `zip_registry` DB table (zip_code, city_name),
indexed on zip_code, populated once via an Alembic migration using the same
bulk-import pattern as the existing `zip_distances` table. It is read-only after
that — no writes, no relations, purely a reference lookup.

## What gets built on top of it

- `GET /users/zip/{zip_code}/cities` — returns the list of valid city names for a
  given ZIP code; used to populate the city dropdown when a user enters their ZIP
- Registration and profile update endpoints will reject any `(zip_code, city)` pair
  not present in the registry with a clear 422 error

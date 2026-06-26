# Cursor Pagination — Design Detail

## The core problem

We need to browse 200,000+ rows, newest-first, in pages, while products are
being inserted and updated concurrently, with a guarantee of no duplicates and
no missing rows. OFFSET-based pagination cannot give that guarantee (see
README section 4) -- cursor pagination can, because it anchors on a literal
data value instead of a row count.

## Sort key: (updated_at DESC, id DESC)

A cursor only works if the sort order is **total** (every row has a unique
position) and **stable** (the position of a row already seen doesn't change
while paging, modulo legitimate updates to that row). `updated_at` alone is
neither -- ties are common at this scale. Pairing it with `id` (primary key,
globally unique) makes every row's position unique and deterministic.

## Why DESC + "<" and not ASC + ">"

The product asks for newest-first browsing. With both columns descending, the
next page is "everything strictly less than where I am," expressed as a single
row-value comparison:

```sql
WHERE (updated_at, id) < (:cursor_updated_at, :cursor_id)
```

This is one comparison, not two AND'd inequalities -- `(a, b) < (x, y)` in
Postgres means: `a < x`, OR (`a = x` AND `b < y`). Writing it as two separate
`AND`-ed conditions (`updated_at <= :cur AND id < :cur_id`) is a classic bug:
it silently drops every row that ties on `updated_at` but has a *larger* id
than the cursor, even though those rows correctly belong on a later page.

## The has_more / LIMIT+1 trick

The repository requests `limit + 1` rows. If exactly `limit` come back, we've
hit the end of the result set (`has_more = False`, no `next_cursor`). If
`limit + 1` come back, there's more data -- the extra row is dropped before
the response is built, and `next_cursor` is derived from the new *last* row
of the trimmed set. This avoids a second `COUNT(*)` round-trip just to answer
"is there a next page."

## Cursor encoding

```python
{"updated_at": "<iso8601>", "id": "<uuid>"}  -> json.dumps -> base64
```

Why Base64-JSON and not, say, the raw row values concatenated: it's
self-describing (easy to debug by decoding it), versionable (new fields can be
added without breaking old clients that ignore unknown keys), and opaque
enough that clients won't be tempted to construct or edit one by hand.

## Filters + cursor together

Category/price/search filters are applied as additional `WHERE` clauses ANDed
with the cursor condition, *before* the `ORDER BY`/`LIMIT`. This means a
filtered cursor is only meaningful for that same filter combination -- the
API does not currently encode the active filters into the cursor itself,
which means a client must keep sending the same filters on every page of a
session (it isn't expected to change them mid-session). That's a reasonable
constraint for the standard "infinite scroll with filters set once" UX this
project targets.

## What this design explicitly does not support

- Backward pagination (previous page) -- would need a mirrored ASC variant.
- Jump-to-page-N -- inherent to any cursor approach, not specific to this
  implementation.
- Changing sort field at request time -- the index and cursor shape are both
  fixed to `(updated_at, id)`.
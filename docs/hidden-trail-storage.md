# Hidden Trail — Storage Setup

Photo moments are optional and are a soft presence signal only. They never affect score;
QR sequence + answer validation is the only authority.

## Bucket

- **Name:** `hidden-trail-photos`
- **Privacy:** PRIVATE (not public). Raw objects are never served directly to the public.
  Authorized reads (owner album, admin, approved public gallery) go through server-signed URLs.
- **Formats allowed:** JPEG, PNG, WebP
- **Max source upload size:** 5 MB
- **Output format:** WebP (resized/compressed server-side before upload where supported)

## Naming convention

Server constructs the storage path from trusted server state only — never from the browser:

```
hidden-trail/{gameId}/{userId}/{levelId}/{photoId}.webp
```

- `gameId` / `userId` / `levelId` come from the verified JWT / authenticated participant state.
- `photoId` is a random unique id (`uuid.webp`). Raw client filenames and path fragments are never used.

## Permissions

- Use the **service-role** client in the Koa/backend server for storage uploads and deletes.
  Never expose the service-role key or signed-URL admin in the browser.
- Keep the bucket **private**; issue temporary signed URLs server-side for display.

## Database metadata

The `hidden_trail_photos` table stores only the `storage_path` (not permanent signed URLs).
Signed URLs are minted per request. Table columns: `id`, `game_id`, `level_id`, `user_id`,
`storage_path`, `capture_stage`, `visibility`, `moderation_status`, `is_favorite`,
`created_at`, `updated_at`.

## Manual verification

1. In Supabase Dashboard → Storage → confirm `hidden-trail-photos` bucket exists and is private.
2. Upload a test image via the backend and confirm an object appears under `hidden-trail/<gameId>/...`.
3. Confirm raw object URLs are not publicly accessible (access returns 400/403 without a signed token).
4. Confirm RLS on `hidden_trail_photos` is enabled (public only sees `approved` + `gallery`/`featured` rows).

## Orphan cleanup

Deleting a photo should delete the storage object and the DB row. If storage deletion fails,
record the state (the DB row may be soft-marked) rather than silently claiming success. A simple
admin/dev cleanup query can list rows whose storage object no longer exists.
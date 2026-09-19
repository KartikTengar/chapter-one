# CHAPTER ONE — Security QA

Verified against the running application + live database (Playwright browser + API + DB queries).

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Anonymous → `/dashboard` | redirect to login | redirect to `/login?redirect=/dashboard` | PASS |
| Anonymous → `/admin/*` | redirect to login | redirect to `/login?redirect=...` | PASS |
| Student → `/admin/*` (page) | blocked | redirected to `/dashboard?denied=admin` | PASS |
| Student → admin API | 403 | 403 | PASS |
| Signup with `role=admin` metadata | profile role stays `student` | profile role = `student` | PASS |
| Service-role key in `src` | none | none | PASS |
| Service-role key in built `.next` | none | none | PASS |
| Browser calls game RPCs directly (`process_qr_answer`/`validate_qr_token`) | none | none (all via Koa) | PASS |
| Canonical answer in scan response | none | none | PASS |
| `answer_hash` in student API responses | none | none | PASS |
| `admin_location` in student payloads | none | none | PASS |
| Future QR tokens in student state | none | none (only scanned level returned) | PASS |
| Future location riddles in student state | none | none | PASS |
| Legacy hard-coded game UUID as authority | none | none (only a documented constant in `config.ts`) | PASS |
| Photo cross-user delete (student B → student A photo) | 403 | 403 | PASS |
| Photo oversized file | safe rejection | 400 `PHOTO_TOO_LARGE` | PASS |
| Wrong MIME | safe rejection | 400 `PHOTO_TYPE_UNSUPPORTED` | PASS |
| Public live payload contains user id / email / token | none | none | PASS |
| Score / level / position tampering | server ignores | server-authoritative atomic functions | PASS |
| Concurrency (parallel correct answers) | unique positions | positions 1, 2, 3 unique | PASS |
| Duplicate completion | no second score | `ALREADY CLEARED`, 0 extra points | PASS |
| Wrong trail | no clue/score leak | rejected, riddles null | PASS |
| RLS enabled on `hidden_trail_photos` + QR tables | enabled | enabled (verified via pg) | PASS |
| `service_role` only has EXECUTE on trail functions | restricted | EXECUTE only (verified) | PASS |

No critical security findings remain.
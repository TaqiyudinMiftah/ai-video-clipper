# AI Automation Video Clipper

MVP web application for submitting source videos, tracking OpusClip processing tasks, reviewing generated clips, and preparing TikTok uploads through Composio.

This repository is currently through **Phase 7**:

- Next.js App Router scaffold
- TypeScript configuration
- Tailwind CSS styling
- Prisma schema for core MVP records
- Database-backed API route skeletons
- Basic dashboard, video, and integration pages
- Placeholder service boundaries for queue, storage, Playwright OpusClip automation, and Composio upload
- BullMQ workers for OpusClip processing and TikTok upload
- Supabase-backed storage abstraction for source videos and clips
- Optional OpusClip API processing path for accounts with official API access
- Composio TikTok upload service boundary
- Structured logging, retry controls, worker health check, and troubleshooting notes

Real Playwright OpusClip selectors still need to be filled in manually. If your OpusClip plan includes API access, enable the OpusClip API path for real clipping instead of the placeholder Playwright flow. TikTok upload is wired through Composio, but requires valid Composio/TikTok configuration before it can run successfully.

## Requirements

- Node.js 20+ (Node 24 is fine)
- npm
- PostgreSQL
- Redis

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Start local PostgreSQL and Redis with Docker:

   ```bash
   docker compose up -d
   ```

   The included compose file starts:

   - PostgreSQL at `localhost:5432`
   - Redis at `localhost:6379`

4. Update `DATABASE_URL` in `.env` if you are not using the Docker defaults. For the included Docker setup, use:

   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_video_clipper
   REDIS_URL=redis://localhost:6379
   ```

5. Generate Prisma Client:

   ```bash
   npm run prisma:generate
   ```

6. Run database migrations:

   ```bash
   npm run prisma:migrate
   ```

7. Configure storage:

   - Create a private Supabase Storage bucket, for example `clips`.
   - Set `STORAGE_PROVIDER=supabase`.
   - Set `SUPABASE_URL`.
   - Set `SUPABASE_SERVICE_ROLE_KEY` server-side only. Never expose it to the browser.
   - Set `SUPABASE_STORAGE_BUCKET=clips` or your chosen bucket name.

8. Start the development server:

   ```bash
   npm run dev
   ```

9. In a second terminal, start the OpusClip worker:

   ```bash
   npm run worker:opusclip
   ```

10. In another terminal, start the TikTok upload worker when testing uploads:

   ```bash
   npm run worker:upload
   ```

11. Open `http://localhost:3000/dashboard`.

12. Check queue and worker health when debugging:

   ```bash
   npm run worker:health
   ```

## OpusClip Session Setup

The Playwright path uses your own saved browser session. It does not bypass CAPTCHA, rate limits, or any OpusClip security controls. Treat this as an MVP/internal automation path because OpusClip UI changes can break selectors.

1. Install the Chromium browser used by Playwright:

   ```bash
   npm run playwright:install
   ```

2. Configure these values in `.env`:

   ```bash
   OPUSCLIP_LOGIN_URL=https://clip.opus.pro/dashboard
   OPUSCLIP_APP_URL=https://clip.opus.pro/dashboard
   OPUSCLIP_STORAGE_STATE_PATH=./playwright/.auth/opusclip.json
   ```

3. Run the manual login helper:

   ```bash
   npm run opusclip:login
   ```

4. Complete the normal user-owned login flow in the browser, then press Enter in the terminal to save `storageState`.

5. Start the worker:

   ```bash
   npm run worker:opusclip
   ```

Failure artifacts are written under `OPUSCLIP_ARTIFACTS_DIR` and include a screenshot when a page is available plus a JSON error file with the current URL.

### Real Playwright Clipping

If you are not using the OpusClip API, enable the browser automation flags after you have a valid saved session:

```bash
OPUSCLIP_USE_API=false
OPUSCLIP_REQUIRE_SAVED_SESSION=true
OPUSCLIP_MOCK_CREATE_CLIP=false
OPUSCLIP_HEADLESS=false
OPUSCLIP_ENABLE_REAL_SUBMIT=true
OPUSCLIP_ENABLE_REAL_WAIT=true
OPUSCLIP_ENABLE_REAL_LIST=true
OPUSCLIP_ENABLE_REAL_DOWNLOAD=true
```

Keep `OPUSCLIP_HEADLESS=false` for the first few runs so you can watch the browser and confirm the flow. After it works reliably, you can try `OPUSCLIP_HEADLESS=true`.

Optional selector overrides are available when OpusClip changes UI copy or markup:

```bash
OPUSCLIP_UPLOAD_BUTTON_SELECTOR=
OPUSCLIP_FILE_INPUT_SELECTOR=
OPUSCLIP_URL_INPUT_SELECTOR=
OPUSCLIP_SUBMIT_BUTTON_SELECTOR=
OPUSCLIP_PROCESSING_COMPLETE_SELECTOR=
OPUSCLIP_GENERATED_CLIP_CARD_SELECTOR=
OPUSCLIP_CLIP_DOWNLOAD_BUTTON_SELECTOR=
OPUSCLIP_NEW_PROJECT_BUTTON_SELECTOR=
```

The worker downloads private source files from Supabase Storage to a local temporary worker file, uploads that file through the OpusClip UI, waits for generated clips, downloads each clip, then uploads the resulting MP4 files back to Supabase Storage.

## OpusClip API Setup

Use this path when you want the worker to actually submit videos to OpusClip, wait for exportable clips, download the generated MP4 files, and store them back in Supabase Storage. OpusClip API access is available only for eligible OpusClip plans, so keep the Playwright skeleton disabled unless you have manually implemented and tested selectors.

1. In OpusClip, generate an API key from the OpusClip dashboard if your plan includes API access.

2. Configure server-side environment variables:

   ```bash
   OPUSCLIP_USE_API=true
   OPUSCLIP_API_BASE_URL=https://api.opus.pro/api
   OPUSCLIP_API_KEY=
   OPUSCLIP_ORG_ID=
   OPUSCLIP_API_POLL_INTERVAL_MS=30000
   OPUSCLIP_API_MAX_WAIT_MS=1800000
   OPUSCLIP_API_CLIP_DURATION_SECONDS=90
   OPUSCLIP_API_CURATION_MODEL=ClipBasic
   OPUSCLIP_API_SOURCE_LANG=auto
   OPUSCLIP_MOCK_CREATE_CLIP=false
   ```

   `OPUSCLIP_ORG_ID` is optional unless your OpusClip account requires the `x-opus-org-id` header.

3. Restart the OpusClip worker after changing `.env`:

   ```bash
   npm run worker:opusclip
   ```

4. Submit a video from `/videos/new`. For file uploads, the worker downloads the private source file from Supabase Storage, uploads it to OpusClip through the API upload-link flow, creates a clip project, polls exportable clips, downloads the generated clips, and stores those clips under `users/{userId}/videos/{videoId}/clips/{clipId}.mp4`.

## Composio TikTok Setup

Phase 6 adds the TikTok-only Composio upload path. It does not add YouTube or Instagram upload.

1. Create or configure a Composio TikTok connection in your Composio account.

2. Set server-side environment variables:

   ```bash
   COMPOSIO_API_KEY=
   COMPOSIO_TIKTOK_CONNECTED_ACCOUNT_ID=
   COMPOSIO_TIKTOK_UPLOAD_ACTION=TIKTOK_UPLOAD_VIDEO
   COMPOSIO_TOOLKIT_VERSION_TIKTOK=
   COMPOSIO_TIKTOK_PUBLISH=false
   COMPOSIO_TIKTOK_PRIVACY_LEVEL=SELF_ONLY
   ```

3. Keep `COMPOSIO_TIKTOK_PUBLISH=false` while testing if you only want to verify upload staging. Set it to `true` only when you are ready for Composio/TikTok to attempt publishing.

4. Run the upload worker:

   ```bash
   npm run worker:upload
   ```

The worker creates a signed URL for the private clip file, stages it with `composio.files.upload`, then executes `TIKTOK_UPLOAD_VIDEO` with caption metadata. If `COMPOSIO_API_KEY` is missing, the upload job fails cleanly and stores the error in `upload_targets` and `logs`.

## Useful Commands

```bash
npm run typecheck
npm run build
npm run prisma:studio
npm run worker:opusclip
npm run worker:upload
npm run worker:health
npm run opusclip:login
npm run playwright:install
```

## Troubleshooting

- `Failed to enqueue ... Check REDIS_URL and Redis availability`: start Redis, verify `REDIS_URL`, then run `npm run worker:health`.
- `COMPOSIO_API_KEY is missing`: add `COMPOSIO_API_KEY` to the worker environment and restart `npm run worker:upload`.
- `Clip must have a storage path`: the clip has not been stored yet. Confirm the OpusClip worker produced a clip row with `storage_path`.
- `SUPABASE_SERVICE_ROLE_KEY is required for storage operations`: set Supabase server-side storage env vars and never expose the service role key to frontend code.
- `OPUSCLIP_API_KEY is required when OPUSCLIP_USE_API=true`: add your OpusClip API key to the worker environment and restart `npm run worker:opusclip`.
- `OpusClip API completed without returning downloadable clips`: check OpusClip credits, API plan access, processing status in the OpusClip dashboard, and whether the video is supported by OpusClip.
- `OpusClip session is not logged in`: rerun `npm run opusclip:login`, complete the normal login flow, save the session, then restart `npm run worker:opusclip`.
- `Could not find an OpusClip upload button or file input`: run the worker headed with `OPUSCLIP_HEADLESS=false`, inspect the failure screenshot, then set `OPUSCLIP_UPLOAD_BUTTON_SELECTOR` or `OPUSCLIP_FILE_INPUT_SELECTOR`.
- `OpusClip Playwright automation completed without storing clips`: inspect `OPUSCLIP_ARTIFACTS_DIR`, then tune `OPUSCLIP_GENERATED_CLIP_CARD_SELECTOR` or `OPUSCLIP_CLIP_DOWNLOAD_BUTTON_SELECTOR`.
- `EPERM` while running `next build` on Windows: stop any running Next dev/build process and rerun the build so `.next` files can be cleaned.
- OpusClip failures with screenshots: inspect `OPUSCLIP_ARTIFACTS_DIR` for screenshot and error JSON artifacts.
- Upload keeps failing after retries: inspect `upload_targets.error_message`, `logs`, and the Composio dashboard connection state.

## Phase Notes

- `POST /api/videos` accepts URL submissions or `multipart/form-data` file uploads.
- File uploads currently support `.mp4`, `.mov`, and `.webm`.
- Uploaded source videos are stored at `users/{userId}/videos/{videoId}/source.{ext}` and saved to `videos.source_storage_path`.
- Video processing jobs are enqueued in BullMQ using `REDIS_URL`.
- `npm run worker:opusclip` starts the worker and calls either the OpusClip API path (`OPUSCLIP_USE_API=true`) or Playwright browser automation.
- The OpusClip API path creates a project, polls exportable clips, downloads generated MP4 files, uploads them to storage, and creates `Clip` records.
- The Playwright path uses conservative fallback selectors plus optional `OPUSCLIP_*_SELECTOR` overrides. Keep concurrency at `1`.
- `/videos/:id` now shows clip previews and editable title, caption, and hashtag metadata when clip rows exist.
- `POST /api/clips/:id/generate-caption` uses a safe placeholder caption service. If `OPENAI_API_KEY` is missing, it returns and stores a clear placeholder response instead of calling an external API.
- `POST /api/clips/:id/upload` validates the clip storage path, creates an `UploadTarget`, and queues a TikTok upload job.
- `npm run worker:upload` starts the dedicated Composio TikTok upload worker with default concurrency `1`.
- The upload worker retries failed TikTok uploads up to 3 attempts with a 5 minute fixed delay.
- `npm run worker:health` prints Redis ping status, BullMQ queue counts, and database job counts.
- API JSON request bodies use Zod validation and return field-level validation details.
- Dashboard and video ledger pages show live database-backed error states and retry buttons.
- API handlers do not run long-lived automation work.
- Playwright automation belongs in worker/service modules and is not production-ready yet.
- Composio credentials must stay server-side and must not be exposed to the frontend.

## TODO Before Production

- Real OpusClip selectors: replace placeholder selectors in `src/lib/opusclip/selectors.ts` with tested, stable selectors and keep CAPTCHA/rate-limit guardrails intact.
- Real Composio TikTok action mapping: confirm the exact `TIKTOK_UPLOAD_VIDEO` arguments, toolkit version, connection ID, publish behavior, and response shape for the target Composio account.
- Production deployment: add real auth, secrets management, managed Redis/Postgres, worker process supervision, migrations, backups, and observability dashboards.
- Compliance review: review OpusClip and TikTok/Composio terms, consent, rate limits, content policy, and data retention before external or high-volume use.

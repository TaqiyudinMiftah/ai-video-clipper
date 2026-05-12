# PRD & FSD — AI Automation Clipping Video

## 0. Konteks Singkat

Produk ini adalah sistem automasi untuk membantu user memproses daftar video menjadi clip pendek menggunakan OpusClip, menyimpan hasilnya ke storage, lalu mengunggah clip tersebut secara otomatis ke platform tujuan seperti YouTube Shorts, TikTok, atau Instagram Reels.

Untuk kondisi MVP saat ini, integrasi OpusClip menggunakan **Playwright Worker** karena API OpusClip tidak tersedia secara terbuka untuk small-volume user. Untuk proses upload ke platform sosial, sistem menggunakan **Composio** agar integrasi OAuth dan API platform tujuan lebih aman dan mudah dikelola.

---

# Part 1 — PRD: Product Requirements Document

## 1. Product Overview

### 1.1 Nama Produk

**AI Automation Video Clipper**

### 1.2 Deskripsi Produk

AI Automation Video Clipper adalah aplikasi web yang memungkinkan user memasukkan daftar video, memproses video tersebut menjadi short clips melalui OpusClip, menyimpan hasil clip ke storage, lalu mengunggah hasil clip secara otomatis ke platform tujuan.

Produk ini bertujuan mengurangi pekerjaan manual dalam proses:

1. Mengumpulkan video.
2. Mengunggah video ke OpusClip.
3. Menunggu hasil clipping.
4. Mengunduh hasil clip.
5. Menyimpan hasil clip.
6. Membuat caption/title/hashtag.
7. Mengunggah clip ke platform sosial.

### 1.3 Masalah yang Diselesaikan

Content creator atau operator social media sering perlu mengubah video panjang menjadi beberapa short clips. Proses ini biasanya manual, repetitif, memakan waktu, dan sulit dikelola jika jumlah video banyak.

Masalah utama:

* Upload video ke OpusClip masih manual.
* Hasil clip perlu dicek dan diunduh satu per satu.
* File hasil clip perlu disimpan ulang ke storage.
* Upload ke YouTube/TikTok/Reels dilakukan manual.
* Tidak ada dashboard status untuk melihat progress setiap video.
* Sulit melakukan retry jika salah satu proses gagal.

### 1.4 Tujuan Produk

Produk ini bertujuan membuat workflow clipping video menjadi semi-otomatis hingga otomatis.

Tujuan utama MVP:

* User dapat memasukkan daftar video dari Web UI.
* Sistem dapat membuat task clipping untuk setiap video.
* Sistem dapat mengirim video ke OpusClip menggunakan Playwright Worker.
* Sistem dapat mengambil atau mengunduh hasil clip dari OpusClip.
* Sistem dapat menyimpan hasil clip ke storage.
* Sistem dapat mengunggah hasil clip ke platform tujuan menggunakan Composio.
* User dapat melihat status setiap video dan clip.
* Sistem memiliki retry dan logging ketika proses gagal.

### 1.5 Non-Goals untuk MVP

Hal yang tidak menjadi fokus MVP:

* Tidak membuat model AI clipping sendiri.
* Tidak membuat pengganti OpusClip.
* Tidak mendukung semua platform sosial sekaligus.
* Tidak mendukung multi-tenant enterprise dari awal.
* Tidak melakukan full autonomous AI agent untuk klik UI.
* Tidak melakukan bypass CAPTCHA, rate limit, atau sistem keamanan pihak ketiga.
* Tidak menjalankan automation dalam skala besar tanpa izin dari pihak layanan terkait.

### 1.6 Target User

#### Primary User

Content creator, social media manager, atau operator konten yang sering membuat clip pendek dari video panjang.

#### Secondary User

Founder, developer, atau agency kecil yang ingin menguji workflow automasi short-form content sebelum membangun sistem production yang lebih besar.

### 1.7 Persona

#### Persona 1 — Solo Creator

* Memiliki beberapa video panjang.
* Ingin mengubah video menjadi clip pendek.
* Ingin menghemat waktu upload dan download manual.
* Tidak membutuhkan fitur enterprise.

#### Persona 2 — Social Media Operator

* Mengelola banyak video untuk brand atau channel.
* Perlu melihat status setiap video.
* Perlu upload clip ke platform tujuan.
* Membutuhkan sistem yang bisa retry ketika gagal.

#### Persona 3 — Developer / Founder

* Ingin membuat MVP SaaS automation.
* Perlu workflow yang modular.
* Ingin memulai dengan Playwright tetapi tetap siap migrasi ke API resmi jika tersedia.

---

## 2. User Stories

### 2.1 Video Submission

Sebagai user, saya ingin memasukkan daftar video agar sistem dapat memprosesnya secara otomatis.

Acceptance criteria:

* User dapat menambahkan video melalui URL.
* User dapat mengunggah file video dari lokal.
* User dapat menambahkan beberapa video sekaligus.
* Sistem membuat task untuk setiap video.
* Sistem menampilkan status awal sebagai `pending`.

### 2.2 Task Monitoring

Sebagai user, saya ingin melihat status setiap video agar saya tahu progress proses clipping.

Acceptance criteria:

* User dapat melihat list task video.
* Setiap task memiliki status.
* User dapat melihat error jika task gagal.
* User dapat melakukan retry task gagal.

### 2.3 OpusClip Automation

Sebagai user, saya ingin sistem mengirim video ke OpusClip agar saya tidak perlu upload manual.

Acceptance criteria:

* Worker dapat mengambil task dari queue.
* Worker dapat membuka OpusClip menggunakan session yang tersimpan.
* Worker dapat mengunggah video atau memasukkan URL video.
* Worker dapat menunggu proses clipping selesai.
* Worker dapat mengambil daftar clip hasil processing.

### 2.4 Clip Storage

Sebagai user, saya ingin hasil clip disimpan di storage agar file dapat diakses ulang.

Acceptance criteria:

* Sistem dapat menyimpan clip ke object storage.
* Setiap clip memiliki URL/path storage.
* Metadata clip disimpan di database.
* User dapat melihat atau mengunduh clip dari dashboard.

### 2.5 Auto Upload

Sebagai user, saya ingin clip otomatis diunggah ke platform tujuan agar proses publikasi lebih cepat.

Acceptance criteria:

* User dapat memilih platform tujuan.
* Sistem menggunakan Composio untuk upload.
* Sistem menyimpan status upload.
* Sistem menyimpan URL hasil upload jika tersedia.
* Sistem dapat melakukan retry upload jika gagal.

### 2.6 Caption Generation

Sebagai user, saya ingin sistem membantu membuat title, caption, dan hashtag agar hasil upload lebih siap dipublikasikan.

Acceptance criteria:

* Sistem dapat membuat caption otomatis menggunakan LLM.
* User dapat mengedit caption sebelum upload.
* Caption tersimpan di database.
* Caption digunakan saat upload ke platform tujuan.

---

## 3. Product Scope

## 3.1 MVP Scope

Fitur MVP:

1. Authentication sederhana.
2. Dashboard video task.
3. Input video URL.
4. Upload file video ke storage.
5. Queue task processing.
6. Playwright Worker untuk OpusClip.
7. Download hasil clip.
8. Simpan hasil clip ke storage.
9. Generate title/caption sederhana.
10. Upload clip menggunakan Composio.
11. Retry failed task.
12. Basic logging.

## 3.2 Future Scope

Fitur lanjutan:

1. Integrasi OpusClip API resmi jika akses tersedia.
2. Multi-user workspace.
3. Scheduling upload.
4. Approval flow sebelum upload.
5. AI clip ranking.
6. Template caption per platform.
7. Bulk upload dengan concurrency control.
8. Analytics upload.
9. Payment dan subscription.
10. Webhook untuk status update.

---

## 4. Success Metrics

### 4.1 Product Metrics

* Jumlah video yang berhasil diproses.
* Jumlah clip yang berhasil dibuat.
* Jumlah clip yang berhasil diupload.
* Rata-rata waktu dari video submission sampai clip siap.
* Persentase task gagal.
* Persentase task berhasil setelah retry.

### 4.2 MVP Success Criteria

MVP dianggap berhasil jika:

* Minimal 80% video berhasil dikirim ke OpusClip melalui Playwright Worker.
* Minimal 80% hasil clip berhasil disimpan ke storage.
* Minimal 70% clip berhasil diupload ke platform tujuan menggunakan Composio.
* User dapat melihat status task dengan jelas.
* Sistem dapat melakukan retry untuk task gagal.

---

## 5. Risiko Produk

### 5.1 Risiko ToS dan Compliance

Karena MVP menggunakan Playwright untuk mengotomasi OpusClip, terdapat risiko terkait Terms of Service. Sistem tidak boleh digunakan untuk bypass CAPTCHA, rate limit, security mechanism, atau melakukan scraping yang tidak perlu.

Mitigasi:

* Gunakan hanya untuk MVP/internal testing.
* Batasi concurrency.
* Gunakan akun resmi milik sendiri.
* Jangan melakukan automation massal tanpa izin.
* Siapkan migrasi ke API resmi jika tersedia.
* Simpan sistem secara modular agar Playwright dapat diganti oleh API.

### 5.2 Risiko UI OpusClip Berubah

Playwright bergantung pada struktur UI. Jika UI OpusClip berubah, automation bisa gagal.

Mitigasi:

* Gunakan selector yang stabil.
* Buat screenshot/log ketika gagal.
* Buat manual fallback.
* Buat health check worker.

### 5.3 Risiko Platform Upload

Platform seperti YouTube atau TikTok memiliki policy, rate limit, review, dan restriction masing-masing.

Mitigasi:

* Gunakan Composio/API resmi.
* Simpan status OAuth.
* Validasi ukuran, durasi, dan format video.
* Tambahkan error handling untuk upload failure.

---

# Part 2 — FSD: Functional Specification Document

## 6. System Architecture

## 6.1 High-Level Architecture

```text
Client
  ↓
Web UI
  ↓
Backend API
  ↓
Database + Queue
  ↓
Playwright Worker for OpusClip
  ↓
Clip Result Storage
  ↓
Composio Uploader
  ↓
YouTube / TikTok / Reels
```

## 6.2 Recommended Tech Stack

### Frontend

* Next.js / React
* Tailwind CSS
* Shadcn UI

### Backend

* Node.js + NestJS / Express
* Alternative: FastAPI

### Database

* PostgreSQL
* Supabase PostgreSQL bisa digunakan untuk MVP

### Queue

* BullMQ + Redis
* Alternative: Celery + Redis jika backend Python

### Browser Automation

* Playwright

### Storage

* Cloudflare R2
* AWS S3
* Supabase Storage

### Upload Integration

* Composio

### AI Captioning

* OpenAI API / local LLM / model lain sesuai kebutuhan

---

## 7. Main Functional Modules

## 7.1 Authentication Module

### Purpose

Mengatur user login dan akses dashboard.

### Functional Requirements

* User dapat login.
* User dapat logout.
* Sistem menyimpan session user.
* Setiap task dikaitkan dengan user.

### MVP Option

Gunakan Supabase Auth atau NextAuth.

---

## 7.2 Video Submission Module

### Purpose

Menerima input video dari user.

### Input Type

1. Video URL.
2. File upload.
3. Bulk list URL.

### Functional Flow

```text
User submit video
  ↓
Backend validasi input
  ↓
Jika file: upload ke source storage
  ↓
Simpan metadata video ke database
  ↓
Buat job di queue
  ↓
Status video = pending
```

### Validation

* URL harus valid.
* File harus video.
* Format video yang didukung: MP4, MOV, WEBM.
* Ukuran file mengikuti batas storage dan OpusClip.
* Durasi video dicatat jika memungkinkan.

---

## 7.3 Task Management Module

### Purpose

Mengelola lifecycle video processing.

### Status Lifecycle

```text
pending
queued
uploading_to_opusclip
processing_in_opusclip
downloading_clips
storing_clips
generating_caption
ready_to_upload
uploading_to_platform
completed
failed
cancelled
```

### Functional Requirements

* Sistem membuat task untuk setiap video.
* Sistem memperbarui status task secara berkala.
* User dapat melihat status task.
* User dapat retry task gagal.
* User dapat cancel task yang belum diproses.

---

## 7.4 Queue Module

### Purpose

Mengatur antrean job agar proses automation tidak berjalan bersamaan secara berlebihan.

### Functional Requirements

* Setiap video menghasilkan satu processing job.
* Queue mendukung retry otomatis.
* Queue mendukung delay.
* Queue mendukung concurrency limit.

### Recommended MVP Configuration

```text
OpusClip Worker concurrency: 1
Retry max: 3
Retry delay: 5 minutes
Timeout per job: configurable
```

---

## 7.5 OpusClip Playwright Worker Module

### Purpose

Mengotomasi proses upload video ke OpusClip dan mengambil hasil clip.

### Worker Flow

```text
1. Ambil job dari queue.
2. Load saved browser session.
3. Buka halaman OpusClip.
4. Upload video atau submit URL video.
5. Tunggu proses upload selesai.
6. Tunggu proses clipping selesai.
7. Ambil daftar hasil clip.
8. Download setiap clip.
9. Simpan clip ke temporary folder.
10. Upload clip ke storage.
11. Update database.
12. Trigger upload job ke platform tujuan.
```

### Session Handling

* Playwright menyimpan `storageState`.
* Login manual dapat dilakukan satu kali untuk menyimpan session.
* Worker menggunakan session tersebut untuk task berikutnya.

### Error Handling

Jika gagal:

* Simpan screenshot.
* Simpan log console jika tersedia.
* Simpan error message.
* Ubah status task menjadi `failed`.
* Trigger retry jika retry count belum habis.

### Important Restriction

Worker tidak boleh:

* Bypass CAPTCHA.
* Bypass rate limit.
* Mengakses data yang tidak diperlukan.
* Melakukan scraping massal di luar kebutuhan workflow.
* Menjalankan concurrent browser automation secara agresif.

---

## 7.6 Clip Storage Module

### Purpose

Menyimpan hasil clip dari OpusClip.

### Storage Structure

```text
/users/{user_id}/videos/{video_id}/source.mp4
/users/{user_id}/videos/{video_id}/clips/{clip_id}.mp4
/users/{user_id}/videos/{video_id}/logs/{job_id}.json
/users/{user_id}/videos/{video_id}/screenshots/{job_id}.png
```

### Functional Requirements

* Sistem dapat upload file ke storage.
* Sistem menyimpan storage path di database.
* Sistem dapat membuat signed URL jika storage private.
* Sistem dapat menghapus file jika task dihapus.

---

## 7.7 Caption & Metadata Module

### Purpose

Membuat metadata upload seperti title, caption, description, dan hashtag.

### Functional Requirements

* Generate title otomatis.
* Generate caption otomatis.
* Generate hashtag otomatis.
* User dapat mengedit metadata.
* Metadata tersimpan per clip.

### Example Metadata

```json
{
  "title": "3 Insight Penting dari Video Ini",
  "caption": "Potongan terbaik dari video panjang ini. Simak sampai akhir!",
  "hashtags": ["#shorts", "#ai", "#productivity"]
}
```

---

## 7.8 Composio Upload Module

### Purpose

Mengunggah clip ke platform tujuan menggunakan Composio.

### Supported Platform for MVP

Prioritas MVP:

1. TikTok

YouTube Shorts dan Instagram Reels menjadi future scope. Dengan fokus ke TikTok terlebih dahulu, MVP dapat lebih cepat dikembangkan karena integrasi upload, validasi format video, dan flow OAuth hanya perlu difokuskan pada satu platform utama.

### Upload Flow

```text
Clip ready_to_upload
  ↓
User memilih platform tujuan
  ↓
Backend membuat upload job
  ↓
Composio menjalankan API upload
  ↓
Sistem menerima response
  ↓
Simpan upload URL/status
  ↓
Status menjadi completed atau failed
```

### Functional Requirements

* User dapat connect akun platform melalui OAuth.
* Sistem dapat upload clip ke platform tujuan.
* Sistem dapat mengirim title/caption.
* Sistem menyimpan upload status.
* Sistem menyimpan platform video URL jika tersedia.

---

## 8. Page / Screen Specification

## 8.1 Dashboard Page

### Purpose

Menampilkan ringkasan task video.

### Components

* Total videos.
* Total clips generated.
* Total uploads completed.
* Failed tasks.
* Recent tasks.

### Actions

* Add video.
* View task detail.
* Retry failed task.

---

## 8.2 Add Video Page

### Purpose

User menambahkan video baru.

### Components

* Input video URL.
* Bulk URL textarea.
* File upload input.
* Platform target selection.
* Submit button.

### Validation Message

* Invalid URL.
* Unsupported file type.
* File too large.
* Missing platform target.

---

## 8.3 Video Task List Page

### Purpose

Menampilkan semua video task.

### Columns

* Video title/source.
* Status.
* Created date.
* Number of clips.
* Upload target.
* Error indicator.
* Action.

### Actions

* View detail.
* Retry.
* Cancel.
* Delete.

---

## 8.4 Video Detail Page

### Purpose

Menampilkan detail processing video dan hasil clip.

### Sections

* Source video info.
* Processing status.
* Timeline log.
* Clip result list.
* Upload status.

### Actions

* Preview clip.
* Edit caption.
* Upload now.
* Retry upload.
* Download clip.

---

## 8.5 Integration Settings Page

### Purpose

Mengatur koneksi platform dan credential.

### Components

* Composio connection status.
* YouTube account status.
* TikTok account status.
* Storage connection status.
* OpusClip session status.

### Actions

* Connect platform.
* Disconnect platform.
* Test connection.
* Refresh OpusClip session.

---

## 9. Data Model

## 9.1 users

```sql
users (
  id uuid primary key,
  email text not null unique,
  name text,
  created_at timestamp,
  updated_at timestamp
)
```

## 9.2 videos

```sql
videos (
  id uuid primary key,
  user_id uuid references users(id),
  source_type text, -- url | file
  source_url text,
  source_storage_path text,
  title text,
  duration_seconds integer,
  status text,
  error_message text,
  retry_count integer default 0,
  created_at timestamp,
  updated_at timestamp
)
```

## 9.3 clips

```sql
clips (
  id uuid primary key,
  video_id uuid references videos(id),
  user_id uuid references users(id),
  opusclip_clip_id text,
  storage_path text,
  preview_url text,
  duration_seconds integer,
  title text,
  caption text,
  hashtags text[],
  status text,
  created_at timestamp,
  updated_at timestamp
)
```

## 9.4 upload_targets

```sql
upload_targets (
  id uuid primary key,
  clip_id uuid references clips(id),
  user_id uuid references users(id),
  platform text, -- youtube | tiktok | instagram
  upload_status text,
  uploaded_url text,
  scheduled_at timestamp,
  error_message text,
  retry_count integer default 0,
  created_at timestamp,
  updated_at timestamp
)
```

## 9.5 jobs

```sql
jobs (
  id uuid primary key,
  user_id uuid references users(id),
  video_id uuid references videos(id),
  clip_id uuid references clips(id),
  job_type text, -- opusclip_process | upload_platform | generate_caption
  status text,
  attempts integer default 0,
  max_attempts integer default 3,
  error_message text,
  started_at timestamp,
  completed_at timestamp,
  created_at timestamp,
  updated_at timestamp
)
```

## 9.6 logs

```sql
logs (
  id uuid primary key,
  job_id uuid references jobs(id),
  user_id uuid references users(id),
  level text, -- info | warning | error
  message text,
  metadata jsonb,
  created_at timestamp
)
```

---

## 10. API Specification

## 10.1 Create Video Task

```http
POST /api/videos
```

### Request

```json
{
  "sourceType": "url",
  "sourceUrl": "https://example.com/video.mp4",
  "platformTargets": ["youtube"]
}
```

### Response

```json
{
  "videoId": "uuid",
  "status": "pending"
}
```

---

## 10.2 List Video Tasks

```http
GET /api/videos
```

### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Video title",
      "status": "processing_in_opusclip",
      "createdAt": "timestamp"
    }
  ]
}
```

---

## 10.3 Get Video Detail

```http
GET /api/videos/{videoId}
```

### Response

```json
{
  "id": "uuid",
  "status": "completed",
  "clips": [
    {
      "id": "uuid",
      "storagePath": "path/to/clip.mp4",
      "caption": "caption text",
      "uploadStatus": "completed"
    }
  ]
}
```

---

## 10.4 Retry Video Task

```http
POST /api/videos/{videoId}/retry
```

### Response

```json
{
  "videoId": "uuid",
  "status": "queued"
}
```

---

## 10.5 Update Clip Metadata

```http
PATCH /api/clips/{clipId}
```

### Request

```json
{
  "title": "New title",
  "caption": "New caption",
  "hashtags": ["#shorts", "#ai"]
}
```

---

## 10.6 Upload Clip

```http
POST /api/clips/{clipId}/upload
```

### Request

```json
{
  "platform": "youtube"
}
```

### Response

```json
{
  "uploadTargetId": "uuid",
  "status": "queued"
}
```

---

## 11. Worker Specification

## 11.1 OpusClip Worker

### Input

* `videoId`
* `sourceUrl` or `sourceStoragePath`
* `userId`

### Output

* One or more `clips`
* Clip files uploaded to storage
* Updated video status

### Failure Cases

* OpusClip login expired.
* Upload failed.
* Video processing timeout.
* Clip download failed.
* Storage upload failed.
* UI selector changed.

### Retry Policy

* Max retry: 3
* Retry delay: 5 minutes
* If session expired: mark as `failed_session_expired`

---

## 11.2 Upload Worker

### Input

* `clipId`
* `platform`
* `title`
* `caption`
* `hashtags`

### Output

* Uploaded platform URL
* Upload status

### Failure Cases

* OAuth expired.
* Platform upload limit reached.
* Video format invalid.
* API error from platform.
* Composio error.

---

## 12. Security Requirements

* User hanya dapat melihat task miliknya sendiri.
* Storage private by default.
* Signed URL digunakan untuk preview/download.
* OAuth token platform tidak disimpan sembarangan di frontend.
* Credential OpusClip session disimpan aman di server/worker environment.
* Jangan simpan password plain text.
* Jangan expose API key di frontend.
* Semua API endpoint membutuhkan authentication.

---

## 13. Logging & Observability

### Required Logs

* Task created.
* Worker started.
* Upload to OpusClip started.
* OpusClip processing started.
* Clip download started.
* Storage upload completed.
* Upload to platform started.
* Upload completed.
* Error details.

### Debug Artifacts

Untuk Playwright error:

* Screenshot.
* Trace file jika memungkinkan.
* Console log.
* Current URL.
* Error stack.

---

## 14. Edge Cases

* Video URL tidak bisa diakses.
* Video terlalu panjang.
* Video terlalu besar.
* Video tidak memiliki audio.
* OpusClip tidak menghasilkan clip.
* OpusClip session expired.
* Storage penuh.
* Upload platform ditolak karena copyright/policy.
* Caption kosong.
* User disconnect akun platform saat upload berjalan.
* Worker crash saat proses berjalan.

---

## 15. MVP Development Phases

## Phase 1 — Core Dashboard & Task

Deliverables:

* Auth.
* Add video URL.
* Video task list.
* Database schema.
* Queue setup.

## Phase 2 — Storage & Worker Foundation

Deliverables:

* Upload file to storage.
* Worker service.
* Job status update.
* Logging.

## Phase 3 — OpusClip Playwright Automation

Deliverables:

* Saved session login.
* Submit video to OpusClip.
* Detect processing complete.
* Download result clips.
* Save clips to storage.

## Phase 4 — Clip Review & Metadata

Deliverables:

* Clip list.
* Clip preview.
* Edit title/caption/hashtag.
* Generate caption with LLM.

## Phase 5 — Composio Upload

Deliverables:

* Connect TikTok account.
* Upload clip to TikTok.
* Send caption/description metadata to TikTok.
* Save uploaded TikTok URL or platform response.
* Retry TikTok upload.

## Phase 6 — Hardening

Deliverables:

* Retry policy.
* Error screenshot.
* Worker health check.
* Rate limiting.
* Manual fallback.

---

## 16. Acceptance Criteria for MVP

MVP diterima jika:

1. User dapat login dan membuka dashboard.
2. User dapat menambahkan video URL.
3. Sistem membuat task video.
4. Worker mengambil task dari queue.
5. Worker dapat mengirim video ke OpusClip menggunakan Playwright.
6. Worker dapat mengambil hasil clip.
7. Clip tersimpan di storage.
8. User dapat melihat hasil clip di dashboard.
9. User dapat mengedit caption/title.
10. User dapat mengunggah clip ke TikTok melalui Composio.
11. User dapat melihat status upload.
12. Task gagal dapat diretry.
13. Error utama tersimpan di log.

---

## 17. Recommended Initial Build Order

Urutan paling aman untuk development:

1. Buat database schema.
2. Buat Web UI sederhana untuk submit video.
3. Buat backend API untuk membuat video task.
4. Buat queue dan worker dummy.
5. Buat storage upload/download.
6. Buat Playwright script manual untuk OpusClip.
7. Integrasikan Playwright ke worker.
8. Simpan hasil clip ke storage.
9. Buat page clip review.
10. Integrasikan Composio untuk upload.
11. Tambahkan retry dan logging.
12. Tambahkan caption generation.

---

## 18. Open Questions

Beberapa keputusan yang masih perlu ditentukan:

1. Platform upload MVP sudah ditentukan: TikTok terlebih dahulu.
2. Storage yang digunakan: Supabase Storage, S3, atau Cloudflare R2?
3. Backend stack: Node.js/NestJS atau Python/FastAPI?
4. Apakah user perlu approval sebelum upload otomatis?
5. Apakah caption dibuat otomatis sebelum user review atau langsung dipakai?
6. Apakah video input hanya URL atau juga file upload sejak MVP?
7. Apakah produk ini untuk penggunaan pribadi/internal atau akan menjadi SaaS publik?
8. Bagaimana batas concurrency Playwright yang aman?
9. Bagaimana fallback jika OpusClip session expired?
10. Apakah perlu sistem scheduling upload?

---

## 19. Final Recommendation

Untuk MVP saat ini, gunakan pendekatan berikut:

```text
Web UI + Backend API + Database + Queue
        ↓
Playwright Worker untuk OpusClip
        ↓
Storage untuk hasil clip
        ↓
Composio untuk upload ke TikTok
```

Pendekatan ini cukup realistis untuk validasi ide karena tidak membutuhkan akses OpusClip API. Namun, sistem harus dibuat modular agar ketika API resmi tersedia, modul Playwright dapat diganti dengan modul API tanpa mengubah keseluruhan produk.

Playwright sebaiknya diperlakukan sebagai solusi MVP/internal, bukan fondasi production jangka panjang tanpa izin atau API resmi dari OpusClip.


# PROJECT_BRIEF.md — AI Automation Video Clipper

## Product Summary

AI Automation Video Clipper adalah aplikasi web untuk membantu user memproses daftar video menjadi short clips menggunakan OpusClip, menyimpan hasil clip ke storage, lalu mengunggah clip ke TikTok menggunakan Composio.

Untuk MVP, sistem menggunakan Playwright Worker untuk mengotomasi OpusClip karena OpusClip API tidak tersedia secara terbuka untuk small-volume user. Upload ke TikTok menggunakan Composio.

## MVP Focus

MVP hanya fokus pada:
- Input video URL atau upload file video.
- Membuat video task.
- Queue processing.
- Playwright Worker untuk OpusClip.
- Menyimpan hasil clip ke storage.
- Preview hasil clip.
- Edit title/caption/hashtag.
- Upload hasil clip ke TikTok menggunakan Composio.
- Retry task gagal.
- Basic logging.

## Non-Goals

MVP tidak mencakup:
- Membuat model AI clipping sendiri.
- Upload ke YouTube Shorts.
- Upload ke Instagram Reels.
- Multi-tenant enterprise.
- Payment/subscription.
- Bypass CAPTCHA, rate limit, atau sistem keamanan OpusClip.
- Automation massal tanpa izin.

## Recommended Tech Stack

Frontend:
- Next.js
- TypeScript
- Tailwind CSS
- Shadcn UI

Backend:
- Next.js Route Handlers

Database:
- PostgreSQL
- Prisma ORM

Queue:
- Redis
- BullMQ

Automation:
- Playwright Worker

Storage:
- Storage service abstraction
- Initial target: Supabase Storage or Cloudflare R2

Uploader:
- Composio TikTok integration

Auth:
- Supabase Auth or NextAuth placeholder for MVP

## System Architecture

Client
→ Web UI
→ Backend API
→ Database + Queue
→ Playwright Worker for OpusClip
→ Storage
→ Composio TikTok Uploader
→ TikTok

## Core Status Lifecycle

Video status:
- pending
- queued
- uploading_to_opusclip
- processing_in_opusclip
- downloading_clips
- storing_clips
- generating_caption
- ready_to_upload
- uploading_to_tiktok
- completed
- failed
- cancelled

Clip status:
- created
- stored
- ready_to_upload
- uploading
- uploaded
- failed

## Required Pages

1. Dashboard
2. Add Video
3. Video Task List
4. Video Detail
5. Clip Review
6. Integration Settings

## Required API Routes

POST /api/videos
GET /api/videos
GET /api/videos/:id
POST /api/videos/:id/retry
PATCH /api/clips/:id
POST /api/clips/:id/upload

## Required Database Models

- User
- Video
- Clip
- UploadTarget
- Job
- Log

## MVP Development Phases

Phase 1:
- Project scaffold
- Prisma schema
- Basic dashboard
- Video submission page
- API skeleton

Phase 2:
- Redis + BullMQ
- Worker skeleton
- Job status update

Phase 3:
- Storage service
- File upload support
- Clip storage abstraction

Phase 4:
- Playwright OpusClip worker skeleton
- Saved session support
- Submit video to OpusClip
- Download/store clip placeholder

Phase 5:
- Clip preview
- Edit caption/title/hashtag
- Caption generation placeholder

Phase 6:
- Composio TikTok uploader
- Upload status tracking
- Retry upload

Phase 7:
- Logging
- Error screenshot
- Worker health check
- README and setup docs

## Important Constraints

- Do not hardcode secrets.
- Do not expose API keys to frontend.
- Do not bypass CAPTCHA or security mechanisms.
- Keep Playwright module replaceable by future OpusClip API module.
- Keep Composio TikTok uploader modular.
- Implement each phase incrementally.
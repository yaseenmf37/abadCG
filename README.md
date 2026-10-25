# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


# Abad Cafe Orders

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set a private `ADMIN_PASSWORD` and a long random `SESSION_SECRET`.
3. Start the frontend and order API together with `npm run dev`.
4. Open `http://localhost:3000` for the customer menu and `http://localhost:3000/admin` for the manager page.

The public gallery is available at `http://localhost:3000/gallery`. Managers can upload cafe photos and videos, add or edit captions, and delete media from the `گالری` tab in the admin page. Supported files are JPG, PNG, WEBP, GIF, MP4, WEBM, and MOV, up to 100 MB. Local media files are stored under `public/uploads` and gallery metadata in `data/gallery.json`.

Customers choose products, quantities, and one of 20 tables before submitting. Active orders are stored in `data/orders.json`, polled by the manager page, and removed when the manager closes them.

To use phones on the cafe Wi-Fi, open the computer's LAN address on port `3000`. Keep the computer and server running while taking orders.

## Production

### Vercel + Supabase

1. Create a Supabase project. In Supabase **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql) once. It creates persistent app data, atomic order/table RPCs, and the public media bucket.
2. Copy the Supabase Project URL and **service_role** key from Project Settings → API. Keep the service role key private; never prefix it with `VITE_` and never put it in frontend code.
3. Add these variables in Vercel → Project → Settings → Environment Variables for Production (and Preview if needed): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` (`abad-media`), `ADMIN_PASSWORD` (replace the local test password with a long unique password), and `SESSION_SECRET` (a random value with at least 32 bytes of entropy).
4. To preserve the current local menu, orders, sales, gallery, and uploaded files, put `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET=abad-media` in your local ignored `.env`, then run `npm run migrate:supabase` once. The script imports local JSON and copies `/uploads` media into Supabase Storage. It does not delete local files.
5. In Vercel, keep the Vite build command as `npm run build` and output directory as `dist`, then push/deploy the project. `vercel.json` routes `/api/*` to the Express function and `/admin` and `/gallery` to the React app.
6. Smoke-test customer ordering, manager login, menu editing, image/video upload, order confirmation, and sales reporting on the deployed domain. If browser uploads report CORS errors, allow the Vercel domain in the Supabase Storage CORS settings.

The API uses Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist; otherwise it keeps using local JSON files for development. Uploads in production go directly from the browser to Supabase Storage using short-lived signed URLs, avoiding Vercel's function request-size limit. Use HTTPS and keep the service role key only in Vercel's server environment.

For a separate Node host instead of Vercel, `npm run build` followed by `npm start` still serves the built site and API on `API_PORT` (default `3001`).

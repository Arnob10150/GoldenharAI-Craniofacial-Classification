# GoldenScope AI

GoldenScope AI is a two-sided clinical web platform for Goldenhar Syndrome screening, pediatric follow-up, and referral coordination.

## Stack

- React 19 + TypeScript + Vite
- shadcn/ui + Tailwind CSS v4
- Zustand for client state
- React Hook Form + Zod for validated forms
- Recharts for analytics
- react-leaflet for district visualization
- Sonner for notifications
- Supabase-ready auth, database, storage, and realtime integration
- Real MorphoFusion inference service for local development and Railway deployment

## Repository Layout

```text
.
+-- backend/
¦   +-- goldenscope_inference_api.py
¦   +-- railway.json
¦   +-- requirements.txt
¦   +-- models/
¦       +-- morphofusion_enhanced_best.weights.h5
¦       +-- GoldenharAI_final.keras
+-- public/
+-- src/
¦   +-- app/
¦   +-- features/
¦   +-- shared/
+-- supabase/
¦   +-- schema.sql
+-- package.json
+-- vercel.json
```

## Core Product Areas

- Landing page with role-based entry points
- Parent portal: new scan, scan history, child profiles, PDF export
- Doctor/CHW portal: dashboard, new scan, patient list, scan detail, referrals, analytics
- Explainability, surgical windows, comorbidity summaries, and referral workflows
- Supabase-ready auth, storage, database, and realtime patterns

## Local Development

1. Install frontend dependencies
   `npm install`
2. Copy environment values
   `copy .env.example .env`
3. Add your Supabase values and inference URL
4. Start the inference API
   `cd backend`
   `pip install -r requirements.txt`
   `uvicorn goldenscope_inference_api:app --host 0.0.0.0 --port 8000`
5. In a second terminal, run the frontend
   `npm run dev`
6. Production build
   `npm run build`

## Vercel Deployment

- Deploy the repository root to Vercel.
- `vercel.json` is included for Vite build output and SPA route rewrites.
- Set these environment variables in Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_RAILWAY_INFERENCE_URL`

## Railway Deployment

- Create a Railway service from the same repository.
- Set the Railway service Root Directory to `backend`.
- `backend/railway.json` is included with the FastAPI start command.
- `backend/models` already includes the current MorphoFusion and fallback legacy model artifacts.
- Optional Railway environment variables:
  - `GOLDENSCOPE_MODEL_WEIGHTS`
  - `GOLDENSCOPE_LEGACY_MODEL`

Exposed API routes:
- `GET /health`
- `POST /predict`

## Supabase Setup

- SQL schema: `supabase/schema.sql`
- Storage bucket expected by the app: `scan-images`
- The app falls back to local mock data when Supabase env vars are missing or unreachable.

## Notes

- In development, the frontend defaults to `http://127.0.0.1:8000/predict`.
- In production, set `VITE_RAILWAY_INFERENCE_URL` to your Railway FastAPI endpoint.
- The repo is structured for split deployment: Vercel for frontend, Railway for inference.

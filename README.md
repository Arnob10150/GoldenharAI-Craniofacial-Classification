# GoldenScope AI

GoldenScope AI is a two-sided clinical web platform for Goldenhar Syndrome screening, pediatric follow-up, and referral coordination.

## Stack

- Next.js 16
- React 19 + TypeScript
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
¦   +-- runtime.txt
¦   +-- models/
¦       +-- morphofusion_enhanced_best.weights.h5
¦       +-- GoldenharAI_final.keras
+-- public/
+-- src/
¦   +-- core/
¦   +-- features/
¦   +-- next/
¦   +-- pages/
¦   +-- shared/
+-- supabase/
¦   +-- schema.sql
+-- next.config.mjs
+-- postcss.config.mjs
+-- package.json
```

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
5. In a second terminal, run the frontend from the repo root
   `npm run dev`
6. Production build
   `npm run build`

## Vercel Deployment

- Deploy the repository root to Vercel.
- The frontend now runs as a Next.js app, so Vercel auto-detects it.
- Set these environment variables in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_RAILWAY_INFERENCE_URL`

## Railway Deployment

- Create a Railway service from the same repository.
- Set the Railway service Root Directory to `backend`.
- Use the backend folder as the service source, not the repo root.
- `backend/railway.json` is included with the FastAPI start command.
- `backend/runtime.txt` pins Python 3.11 for TensorFlow compatibility.
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
- In production, set `NEXT_PUBLIC_RAILWAY_INFERENCE_URL` to your Railway FastAPI endpoint.
- The repo is structured for split deployment: Vercel for frontend, Railway for inference.

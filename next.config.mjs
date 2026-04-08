/** @type {import('next').NextConfig} */
const productionInferenceUrl =
  process.env.NEXT_PUBLIC_RAILWAY_INFERENCE_URL ||
  "https://goldenharai-craniofacial-classification-production.up.railway.app/predict";
const normalizedInferenceUrl = productionInferenceUrl.endsWith("/predict")
  ? productionInferenceUrl
  : `${productionInferenceUrl.replace(/\/$/, "")}/predict`;
const inferenceOrigin = normalizedInferenceUrl.replace(/\/predict$/, "");

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/predict",
        destination: normalizedInferenceUrl,
      },
      {
        source: "/api/health",
        destination: `${inferenceOrigin}/health`,
      },
    ];
  },
};

export default nextConfig;

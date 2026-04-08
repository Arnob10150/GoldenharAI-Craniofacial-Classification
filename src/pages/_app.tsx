import type { AppProps } from "next/app";
import "leaflet/dist/leaflet.css";
import "@/index.css";

export default function NextApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

import { BrowserRouter } from "react-router-dom";
import "@/shared/lib/i18n";
import { AppProviders } from "@/core/providers/AppProviders";
import App from "@/core/App";

export default function ClientApp() {
  return (
    <AppProviders>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProviders>
  );
}

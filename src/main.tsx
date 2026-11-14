import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import { isSupabaseConfigured } from "./lib/supabase";
import "./index.css";

// If the Supabase settings are missing, say so clearly instead of showing a broken page.
function SetupNotice() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-3xl font-semibold">Almost there!</h1>
      <p className="mt-3 text-lg">
        Catlas can’t find its Supabase settings. Copy <code>.env.example</code> to <code>.env.local</code>, fill in
        your project’s URL and publishable key, then restart <code>npm run dev</code>.
      </p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isSupabaseConfigured ? (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    ) : (
      <SetupNotice />
    )}
  </StrictMode>,
);

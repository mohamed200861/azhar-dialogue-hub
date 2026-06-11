import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerPWA } from "./pwa/register";

createRoot(document.getElementById("root")!).render(<App />);

// Register the service worker AFTER first render so it never delays paint.
// The wrapper itself refuses to register in dev / Lovable preview / iframes,
// and actively unregisters any stale SW left from previous deploys.
registerPWA();

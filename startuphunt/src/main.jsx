import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./index.css";
import App from "./App.jsx";
import { config } from "./config";

// Initialize Google Analytics
const gaId = config.GA_MEASUREMENT_ID;
if (gaId) {
  // Load GA script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  // Wait for script to load before initializing
  script.onload = () => {
    if (window.gtag) {
      window.gtag('config', gaId, { debug_mode: true });
    }
  };

  // Fallback: try after a short delay if onload doesn't fire
  setTimeout(() => {
    if (window.gtag) {
      window.gtag('config', gaId, { debug_mode: true });
    }
  }, 100);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

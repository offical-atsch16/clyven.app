import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Google Analytics is initialized in index.html
// gtag will be available as window.gtag

createRoot(document.getElementById("root")!).render(<App />);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupFetchInterceptor } from "./utils/fetchClient.ts";

// Setup global fetch interceptor for API routing
setupFetchInterceptor();

createRoot(document.getElementById("root")!).render(<App />);

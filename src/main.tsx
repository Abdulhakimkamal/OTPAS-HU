import { createRoot } from "react-dom/client";
import { setupFetchInterceptor } from "./utils/fetchClient.ts";

// Setup fetch interceptor IMMEDIATELY before anything else
setupFetchInterceptor();

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

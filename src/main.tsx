import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startKeepAlive } from "./lib/supabaseKeepAlive";

// Mantém o Supabase ativo enquanto o app estiver aberto (ping a cada 4h)
startKeepAlive();

createRoot(document.getElementById("root")!).render(<App />);

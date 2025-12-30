import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Reservas from "./pages/Reservas";
import Tutores from "./pages/Tutores";
import Pets from "./pages/Pets";
import WhatsApp from "./pages/WhatsApp";
import Configuracoes from "./pages/Configuracoes";
import ClientReservation from "./pages/ClientReservation";
import Login from "./pages/Login"; // Importar a nova página de Login
import NotFound from "./pages/NotFound";
import { SessionContextProvider } from "./components/auth/SessionContextProvider"; // Importar o SessionContextProvider

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider> {/* Envolver as rotas com o SessionContextProvider */}
          <Routes>
            <Route path="/login" element={<Login />} /> {/* Adicionar a rota de login */}
            <Route path="/" element={<Index />} />
            <Route path="/reservas" element={<Reservas />} />
            <Route path="/tutores" element={<Tutores />} />
            <Route path="/pets" element={<Pets />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/client-reservation" element={<ClientReservation />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
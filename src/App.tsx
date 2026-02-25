import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Consultas from "./pages/Consultas";
import Pacientes from "./pages/Pacientes";
import Dentistas from "./pages/Dentistas";
import WhatsApp from "./pages/WhatsApp";
import Configuracoes from "./pages/Configuracoes";
import Agendamento from "./pages/Agendamento";
import Agenda from "./pages/Agenda"; // Import the new Agenda page
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/consultas" element={<Consultas />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/dentistas" element={<Dentistas />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/agendamento" element={<Agendamento />} />
          <Route path="/agenda" element={<Agenda />} /> {/* New Agenda route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
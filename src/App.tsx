import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Consultas from "./pages/Consultas";
import Pacientes from "./pages/Pacientes";
import Dentistas from "./pages/Dentistas";
import WhatsApp from "./pages/WhatsApp";
import Configuracoes from "./pages/Configuracoes";
import ClientAppointment from "./pages/ClientAppointment";
import Agenda from "./pages/Agenda";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />
          
          {/* Protected System Routes (Simplified for now) */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/consultas" element={<Consultas />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/dentistas" element={<Dentistas />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/client-appointment" element={<ClientAppointment />} />
          <Route path="/agenda" element={<Agenda />} />
          
          {/* Helper Redirects */}
          <Route path="/index" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
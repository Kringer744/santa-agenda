import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy loading de páginas — cada rota só carrega quando acessada
const Index = lazy(() => import("./pages/Index"));
const Consultas = lazy(() => import("./pages/Consultas"));
const Pacientes = lazy(() => import("./pages/Pacientes"));
const Dentistas = lazy(() => import("./pages/Dentistas"));
const WhatsApp = lazy(() => import("./pages/WhatsApp"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Agendamento = lazy(() => import("./pages/Agendamento"));
const Agenda = lazy(() => import("./pages/Agenda"));
const NotFound = lazy(() => import("./pages/NotFound"));

// QueryClient com cache de 1 minuto (reduz requests desnecessários ao trocar de aba)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // 1 minuto: não refaz query se dados ainda frescos
      gcTime: 1000 * 60 * 5,     // 5 minutos: mantém cache mesmo sem observers
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="w-10 h-10 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/agendamento" element={<Agendamento />} />

            <Route path="/" element={<Index />} />
            <Route path="/consultas" element={<Consultas />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/dentistas" element={<Dentistas />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/agenda" element={<Agenda />} />

            <Route path="/client-appointment" element={<Navigate to="/agendamento" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

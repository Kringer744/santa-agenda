import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Stethoscope, 
  MessageSquare, 
  CalendarCheck, 
  TrendingUp, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-foreground font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-dental flex items-center justify-center text-white shadow-soft">
              <Stethoscope size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">DentalClinic</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#funcionalidades" className="hover:text-primary transition-colors">Funcionalidades</a>
            <a href="#automacao" className="hover:text-primary transition-colors">WhatsApp</a>
            <a href="#como-funciona" className="hover:text-primary transition-colors">Como Funciona</a>
          </div>
          <div className="flex items-center gap-4">
            <NavLink to="/dashboard">
              <Button variant="ghost" size="sm" className="hidden sm:flex">Entrar</Button>
            </NavLink>
            <NavLink to="/client-appointment">
              <Button size="sm" className="bg-primary hover:bg-primary/90">Agendar Agora</Button>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 bg-gradient-to-b from-primary/5 to-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider animate-fade-in">
              <Zap size={14} /> O Futuro da Gestão Odontológica
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground animate-slide-up">
              Sua Clínica em <span className="text-primary">Piloto Automático.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
              Reduza faltas em até 40% com lembretes automáticos via WhatsApp e ofereça agendamento online 24h para seus pacientes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <NavLink to="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-elevated w-full sm:w-auto">
                  Ver Demonstração <ChevronRight className="ml-2" />
                </Button>
              </NavLink>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="text-primary" size={18} /> Sem taxas de adesão
              </div>
            </div>
          </div>

          <div className="mt-16 md:mt-24 relative animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl opacity-50 -z-10" />
            <img 
              src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=2000&auto=format&fit=crop" 
              alt="Dashboard Preview" 
              className="rounded-2xl shadow-2xl border border-border mx-auto max-w-5xl"
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="funcionalidades" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 md:mb-24 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Tudo o que você precisa.</h2>
            <p className="text-muted-foreground text-lg">Desenvolvido especificamente para a rotina de dentistas modernos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<CalendarCheck className="text-primary" size={32} />}
              title="Agendamento Inteligente"
              description="Link exclusivo para seus pacientes marcarem consultas sozinhos, sincronizado com seu Google Calendar."
            />
            <FeatureCard 
              icon={<MessageSquare className="text-primary" size={32} />}
              title="Automação WhatsApp"
              description="Confirmações instantâneas, lembretes de consulta e mensagens de aniversário sem você tocar no celular."
            />
            <FeatureCard 
              icon={<TrendingUp className="text-primary" size={32} />}
              title="Gestão Financeira"
              description="Controle de faturamento por procedimento, status de pagamento e relatórios de desempenho da clínica."
            />
          </div>
        </div>
      </section>

      {/* WhatsApp Automation Section */}
      <section id="automacao" className="py-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-24">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                Integração UAZAP
              </div>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                Diga adeus às faltas e ao "esquecimento" do paciente.
              </h2>
              <div className="space-y-6">
                <BenefitItem 
                  title="Lembretes 24h e 1h antes"
                  description="O sistema envia automaticamente um lembrete no dia anterior e horas antes do atendimento."
                />
                <BenefitItem 
                  title="Menu Interativo"
                  description="Seu paciente resolve dúvidas básicas e agenda consultas através de um menu inteligente."
                />
                <BenefitItem 
                  title="Confirmação Instantânea"
                  description="Assim que você agenda no painel, o paciente recebe os detalhes no celular."
                />
              </div>
            </div>
            <div className="flex-1 w-full max-w-md bg-white rounded-3xl shadow-elevated p-6 border border-border relative">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm">DentalClinic</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase">Online</p>
                </div>
              </div>
              <div className="space-y-4">
                <ChatBubble role="bot" text="Olá, Maria! 🦷 Passando para lembrar da sua Limpeza amanhã às 14h com o Dr. João Silva." />
                <ChatBubble role="bot" text="Podemos confirmar sua presença? Digite 1 para Confirmar ou 2 para Reagendar." />
                <ChatBubble role="user" text="1" />
                <ChatBubble role="bot" text="Confirmado! ✅ Nos vemos amanhã. O endereço é Av. Paulista, 1000." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Comece a usar em 3 passos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <StepCard number="01" title="Cadastre sua Equipe" description="Adicione seus dentistas, especialidades e vincule o Google Calendar." />
            <StepCard number="02" title="Defina Serviços" description="Configure seus procedimentos e preços para o agendamento online." />
            <StepCard number="03" title="Divulgue seu Link" description="Coloque seu link de agendamento na bio do Instagram e WhatsApp." />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-[2rem] p-8 md:p-16 text-center text-white space-y-8 relative overflow-hidden shadow-elevated">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <h2 className="text-3xl md:text-5xl font-extrabold max-w-2xl mx-auto">
              Pronto para transformar sua clínica?
            </h2>
            <p className="text-white/80 text-lg md:text-xl max-w-xl mx-auto">
              Junte-se a centenas de dentistas que já digitalizaram seus consultórios com a DentalClinic.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <NavLink to="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold w-full sm:w-auto text-primary hover:bg-white">
                  Começar Agora Grátis
                </Button>
              </NavLink>
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-white text-white hover:bg-white/10 w-full sm:w-auto">
                Falar com Vendas
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white">
                <Stethoscope size={14} />
              </div>
              <span className="font-bold text-lg">DentalClinic</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 DentalClinic Software. Todos os direitos reservados.</p>
            <div className="flex items-center gap-6">
              <ShieldCheck className="text-muted-foreground" size={20} />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Protegido por Supabase</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl border border-border bg-white hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
      <div className="mb-6 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function BenefitItem({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle2 className="text-primary" size={14} />
      </div>
      <div>
        <h4 className="font-bold text-lg">{title}</h4>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="relative pt-8 space-y-4">
      <div className="text-6xl font-black text-primary/5 absolute top-0 left-0 leading-none">{number}</div>
      <h3 className="text-xl font-bold relative z-10">{title}</h3>
      <p className="text-muted-foreground relative z-10">{description}</p>
    </div>
  );
}

function ChatBubble({ role, text }: { role: 'bot' | 'user', text: string }) {
  return (
    <div className={cn(
      "max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed",
      role === 'bot' ? "bg-muted text-foreground rounded-tl-none" : "bg-primary text-white rounded-tr-none ml-auto"
    )}>
      {text}
    </div>
  );
}
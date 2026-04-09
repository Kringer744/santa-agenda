import { Layout } from '@/components/layout/Layout';
import AtendimentoChat from '@/components/atendimento/AtendimentoChat';
import { Headset } from 'lucide-react';

export default function Atendimento() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Headset className="text-primary" /> Atendimento
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Central de conversas e atendimento ao paciente
          </p>
        </div>
        <AtendimentoChat />
      </div>
    </Layout>
  );
}

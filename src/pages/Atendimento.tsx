import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import AtendimentoChat from '@/components/atendimento/AtendimentoChat';
import ChatwootEmbed from '@/components/atendimento/ChatwootEmbed';
import { Headset, MessageSquare, Bot } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Atendimento() {
  const [activeTab, setActiveTab] = useState('chatwoot');

  return (
    <Layout>
      <div className="space-y-4">
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Headset className="text-primary" /> Atendimento
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Central de conversas e atendimento ao paciente
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="chatwoot" className="flex items-center gap-2">
              <MessageSquare size={16} />
              Chatwoot
            </TabsTrigger>
            <TabsTrigger value="interno" className="flex items-center gap-2">
              <Bot size={16} />
              Chat Interno
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chatwoot" className="mt-4">
            <ChatwootEmbed />
          </TabsContent>

          <TabsContent value="interno" className="mt-4">
            <AtendimentoChat />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

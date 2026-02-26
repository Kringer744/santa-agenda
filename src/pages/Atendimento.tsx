import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import ConversationList from '../components/atendimento/ConversationList';
import ChatWindow from '../components/atendimento/ChatWindow';
import PatientSidebar from '../components/atendimento/PatientSidebar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Atendimento() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, pacientes(nome, telefone)')
      .order('last_message_at', { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar conversas:", error);
      toast.error("Falha ao carregar conversas.", {
        description: `Detalhes: ${error.message}`
      });
    } else if (data) {
      setConversations(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Polling 5s
    return () => clearInterval(interval);
  }, []);

  const selectedConv = conversations.find(c => c.id === selectedConversationId);

  return (
    <Card className="h-[calc(100vh-220px)] flex overflow-hidden animate-fade-in">
      <div className="w-1/4 border-r bg-muted/10">
        <ConversationList 
          conversations={conversations} 
          selectedId={selectedConversationId} 
          onSelect={setSelectedConversationId}
          loading={loading}
        />
      </div>
      <div className="flex-1 flex flex-col bg-white">
        <ChatWindow conversation={selectedConv} onMessageSent={fetchConversations} />
      </div>
      <div className="w-1/4 border-l bg-muted/10">
        <PatientSidebar conversation={selectedConv} />
      </div>
    </Card>
  );
}
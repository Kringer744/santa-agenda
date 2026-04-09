import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import PatientSidebar from './PatientSidebar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AtendimentoChat() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        pacientes:patient_id (
          nome,
          telefone
        )
      `)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error("Erro ao buscar conversas:", error);
      if (loading) {
        toast.error("Falha ao carregar conversas. Verifique se as tabelas estão configuradas.");
      }
    } else if (data) {
      setConversations(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedConv = conversations.find(c => c.id === selectedConversationId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="h-[calc(100vh-260px)] flex overflow-hidden animate-fade-in">
      <div className="w-full md:w-1/4 border-r bg-muted/10">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
          loading={loading}
        />
      </div>
      <div className="hidden md:flex flex-1 flex-col bg-white">
        <ChatWindow conversation={selectedConv} onMessageSent={fetchConversations} />
      </div>
      <div className="hidden lg:block w-1/4 border-l bg-muted/10">
        <PatientSidebar conversation={selectedConv} />
      </div>
    </Card>
  );
}

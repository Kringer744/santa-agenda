import { useState, useEffect, useRef } from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { chatwootService } from '@/services/chatwoot.service';
import { cn } from '@/lib/utils';

export default function ChatWindow({ conversation, onMessageSent }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [conversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // 1. Enviar para o Chatwoot
      await chatwootService.sendMessage(conversation.clinic_id, conversation.chatwoot_conversation_id, newMessage);
      
      // 2. Salvar localmente
      await supabase.from('messages').insert({
        clinic_id: conversation.clinic_id,
        conversation_id: conversation.id,
        direction: 'outgoing',
        content: newMessage,
        status: 'sent'
      });

      // 3. Atualizar conversa
      await supabase.from('conversations').update({
        last_message: newMessage,
        last_message_at: new Date().toISOString(),
        status: 'pending' // Bot bloqueado enquanto atendente fala
      }).eq('id', conversation.id);

      setNewMessage('');
      fetchMessages();
      onMessageSent();
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Selecione uma conversa para começar
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="border-b py-4 bg-muted/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
            {conversation.pacientes?.nome?.charAt(0) || 'P'}
          </div>
          {conversation.pacientes?.nome || 'Novo Contato'}
        </CardTitle>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex",
              msg.direction === 'outgoing' ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-[70%] p-3 rounded-2xl text-sm shadow-sm",
                msg.direction === 'outgoing' 
                  ? "bg-primary text-white rounded-tr-none" 
                  : "bg-muted text-foreground rounded-tl-none"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-4 border-t flex gap-2 bg-muted/5">
        <Input 
          placeholder="Digite sua mensagem..." 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className="h-11 rounded-xl"
        />
        <Button type="submit" size="icon" className="h-11 w-11 rounded-xl" disabled={sending}>
          {sending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
        </Button>
      </form>
    </div>
  );
}
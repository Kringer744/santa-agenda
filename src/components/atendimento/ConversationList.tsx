import { CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ConversationList({ conversations, selectedId, onSelect, loading }: any) {
  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-lg">Conversas</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {conversations.map((conv: any) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full p-4 text-left hover:bg-primary/5 transition-colors flex flex-col gap-1",
                selectedId === conv.id && "bg-primary/10 border-l-4 border-primary"
              )}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm truncate max-w-[120px]">
                  {conv.pacientes?.nome || 'Novo Contato'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {conv.last_message_at && format(new Date(conv.last_message_at), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{conv.last_message}</p>
              <div className="flex gap-2 mt-1">
                {conv.priority === 'urgente' && (
                  <Badge variant="destructive" className="text-[9px] h-4 px-1 animate-pulse">
                    <AlertCircle size={10} className="mr-1" /> URGENTE
                  </Badge>
                )}
                <Badge variant="outline" className={cn(
                  "text-[9px] h-4 px-1",
                  conv.status === 'open' ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-amber-600 border-amber-200 bg-amber-50"
                )}>
                  {conv.status === 'open' ? 'Aberto' : 'Pendente'}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
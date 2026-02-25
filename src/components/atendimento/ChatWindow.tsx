import { CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export default function ChatWindow() {
  return (
    <div className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <div className="flex-1 p-4 text-center text-muted-foreground">
        <p className="text-sm">As mensagens aparecerão aqui.</p>
      </div>
      <div className="p-4 border-t flex gap-2">
        <Input placeholder="Digite sua mensagem..." />
        <Button><Send size={16} /></Button>
      </div>
    </div>
  );
}
import { CardHeader, CardTitle } from '@/components/ui/card';

export default function ConversationList() {
  return (
    <div className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Conversas</CardTitle>
      </CardHeader>
      <div className="flex-1 p-4 text-center text-muted-foreground">
        <p className="text-sm">Lista de conversas aparecerá aqui.</p>
      </div>
    </div>
  );
}
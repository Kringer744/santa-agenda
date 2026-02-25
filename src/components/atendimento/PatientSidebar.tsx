import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Calendar, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PatientSidebar({ conversation }: any) {
  const [loading, setLoading] = useState(false);

  const handleToggleUrgency = async () => {
    if (!conversation) return;
    const newPriority = conversation.priority === 'urgente' ? 'normal' : 'urgente';
    await supabase.from('conversations').update({ priority: newPriority }).eq('id', conversation.id);
    toast.success(`Prioridade alterada para ${newPriority}`);
  };

  const handleResolve = async () => {
    if (!conversation) return;
    setLoading(true);
    await supabase.from('conversations').update({ status: 'resolved' }).eq('id', conversation.id);
    toast.success("Conversa marcada como resolvida");
    setLoading(false);
  };

  if (!conversation) return <div className="p-8 text-center text-muted-foreground text-sm">Selecione uma conversa</div>;

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-lg">Ficha do Paciente</CardTitle>
      </CardHeader>
      
      <div className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mx-auto">
            {conversation.pacientes?.nome?.charAt(0) || 'P'}
          </div>
          <h3 className="font-bold text-lg">{conversation.pacientes?.nome || 'Novo Contato'}</h3>
          <Badge variant="outline">{conversation.channel}</Badge>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-3 text-sm">
            <Phone size={16} className="text-muted-foreground" />
            <span>{conversation.pacientes?.telefone || 'Não informado'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={16} className="text-muted-foreground" />
            <span>Próxima consulta: <span className="font-medium">Não agendada</span></span>
          </div>
        </div>

        <div className="space-y-3 pt-6">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
            onClick={handleToggleUrgency}
          >
            <AlertTriangle size={16} />
            {conversation.priority === 'urgente' ? 'Remover Urgência' : 'Marcar como Urgência'}
          </Button>
          
          <Button 
            className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleResolve}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={16} />}
            Resolver Conversa
          </Button>
        </div>
      </div>
    </div>
  );
}
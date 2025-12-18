import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Reserva {
  id: string;
  tutor_id: string;
  pet_id: string;
  unidade_id: string;
  check_in: string;
  check_out: string;
  servicos_adicionais: string[];
  status: 'pendente' | 'confirmada' | 'checkin' | 'hospedado' | 'checkout' | 'finalizada' | 'cancelada';
  valor_total: number;
  codigo_estadia: string | null;
  pagamento_status: 'pendente' | 'aprovado' | 'recusado';
  created_at: string;
  updated_at: string;
}

export function useReservas() {
  return useQuery({
    queryKey: ['reservas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Reserva[];
    },
  });
}

export function useCreateReserva() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reserva: Omit<Reserva, 'id' | 'created_at' | 'updated_at'>) => {
      const codigoEstadia = `EST-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await supabase
        .from('reservas')
        .insert({ ...reserva, codigo_estadia: codigoEstadia })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      toast({ title: 'Reserva criada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao criar reserva', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useUpdateReservaStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Reserva['status'] }) => {
      const { data, error } = await supabase
        .from('reservas')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      toast({ title: 'Status atualizado!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao atualizar status', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

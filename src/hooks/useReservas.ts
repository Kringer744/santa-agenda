import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Reserva } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useReservas() {
  return useQuery<Reserva[]>({
    queryKey: ['reservas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reservas').select('*');
      if (error) throw error;
      return data as Reserva[];
    },
  });
}

export function useCreateReserva() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (reserva: Omit<Reserva, 'id' | 'created_at' | 'updated_at' | 'codigo_estadia' | 'status' | 'pagamento_status'>) => {
      const codigoEstadia = `PH${Date.now().toString(36).toUpperCase().substring(0, 7)}`; // Gerar código de estadia
      const { data, error } = await supabase
        .from('reservas')
        .insert({
          ...reserva,
          codigo_estadia: codigoEstadia,
          status: 'pendente', // Status inicial
          pagamento_status: 'pendente', // Status de pagamento inicial
        })
        .select()
        .single();

      if (error) throw error;
      return data as Reserva;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      toast({
        title: 'Reserva criada com sucesso!'
      });
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
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Reserva;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      toast({
        title: 'Status atualizado!'
      });
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
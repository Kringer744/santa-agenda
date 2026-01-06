import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast'; // Mantém o import para o Radix UI toast
import { toast as sonnerToast } from 'sonner'; // Importa o toast do sonner com alias
import { Dentista } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useDentistas() {
  return useQuery<Dentista[]>({
    queryKey: ['dentistas'],
    queryFn: async () => {
      console.log("Iniciando busca por dentistas no Supabase...");
      const { data, error } = await supabase.from('dentistas').select('*').order('nome');
      if (error) {
        console.error("Erro ao buscar dentistas:", error);
        throw error;
      }
      console.log("Dentistas recebidos do Supabase:", data);
      return data as Dentista[];
    },
  });
}

export function useCreateDentista() {
  const queryClient = useQueryClient();
  const { toast } = useToast(); // Usa o toast do Radix UI
  
  return useMutation({
    mutationFn: async (dentista: Omit<Dentista, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('dentistas')
        .insert(dentista)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este CRO já está cadastrado no sistema.');
        }
        throw error;
      }
      return data as Dentista;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dentistas'] });
      toast({ title: 'Dentista cadastrado com sucesso!' }); // Usa o toast do Radix UI
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar dentista',
        description: error.message,
        variant: 'destructive'
      }); // Usa o toast do Radix UI
    },
  });
}

export function useUpdateDentistaGoogleCalendarId() {
  const queryClient = useQueryClient();
  // Não precisamos do useToast aqui, pois usaremos sonnerToast
  
  return useMutation({
    mutationFn: async ({ id, google_calendar_id }: { id: string; google_calendar_id: string | null }) => {
      const { data, error } = await supabase
        .from('dentistas')
        .update({ google_calendar_id, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Dentista;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dentistas'] });
      sonnerToast.success(`ID do Google Calendar para ${data.nome} atualizado!`); // Usa sonnerToast
    },
    onError: (error: Error) => {
      sonnerToast.error(`Erro ao atualizar ID do Google Calendar: ${error.message}`); // Usa sonnerToast
    },
  });
}

export function useDeleteDentista() {
  const queryClient = useQueryClient();
  const { toast } = useToast(); // Usa o toast do Radix UI
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dentistas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dentistas'] });
      toast({ title: 'Dentista removido com sucesso.' }); // Usa o toast do Radix UI
    },
  });
}
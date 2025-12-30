import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

type ItauSettings = TablesInsert<'itau_settings'>;

export function useItauSettings() {
  return useQuery<ItauSettings | undefined>({ // Alterado para ItauSettings | undefined
    queryKey: ['itauSettings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }

      const { data, error } = await supabase
        .from('itau_settings')
        .select('id, client_id, client_secret, user_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data || undefined; // Retorna data ou undefined
    },
  });
}

export function useSaveItauSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Omit<ItauSettings, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }

      // Try to fetch existing settings to determine if it's an insert or update
      const { data: existingSettings, error: fetchError } = await supabase
        .from('itau_settings')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('itau_settings')
          .update({
            client_id: settings.client_id,
            client_secret: settings.client_secret,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSettings.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Insert new settings
        const { data, error } = await supabase
          .from('itau_settings')
          .insert({
            user_id: user.id,
            client_id: settings.client_id,
            client_secret: settings.client_secret,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itauSettings'] });
      toast({
        title: 'Configurações do Itaú Pix salvas com sucesso!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar configurações do Itaú Pix',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
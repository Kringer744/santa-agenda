import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

// Omit user_id as it's no longer in the table
type ItauSettings = Omit<TablesInsert<'itau_settings'>, 'user_id'>;

export function useItauSettings() {
  return useQuery<ItauSettings | undefined>({
    queryKey: ['itauSettings'],
    queryFn: async () => {
      // No longer checking for authenticated user, fetching a single global setting
      const { data, error } = await supabase
        .from('itau_settings')
        .select('id, client_id, client_secret')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data || undefined;
    },
  });
}

export function useSaveItauSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Omit<ItauSettings, 'id' | 'created_at' | 'updated_at'>) => {
      // No longer checking for authenticated user
      // Try to fetch existing settings to determine if it's an insert or update
      const { data: existingSettings, error: fetchError } = await supabase
        .from('itau_settings')
        .select('id')
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
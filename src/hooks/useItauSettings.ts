import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type ItauSettings = TablesInsert<'itau_settings'>;

export function useItauSettings() {
  return useQuery<ItauSettings>({
    queryKey: ['itauSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itau_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data || {}; // Return empty object if no settings found
    },
  });
}

export function useSaveItauSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: ItauSettings) => {
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
          .update(settings)
          .eq('id', existingSettings.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Insert new settings
        const { data, error } = await supabase
          .from('itau_settings')
          .insert(settings)
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
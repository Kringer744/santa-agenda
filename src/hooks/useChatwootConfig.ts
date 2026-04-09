import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChatwootConfig {
  id: string;
  name: string;
  chatwoot_base_url: string | null;
  chatwoot_account_id: number | null;
  chatwoot_api_token: string | null;
}

export function useChatwootConfig() {
  return useQuery({
    queryKey: ['chatwoot-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, chatwoot_base_url, chatwoot_account_id, chatwoot_api_token')
        .limit(1)
        .single();

      if (error) throw error;
      return data as ChatwootConfig;
    },
  });
}

export function useUpdateChatwootConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: {
      id: string;
      chatwoot_base_url: string;
      chatwoot_account_id: number;
      chatwoot_api_token: string;
    }) => {
      const { error } = await supabase
        .from('clinics')
        .update({
          chatwoot_base_url: config.chatwoot_base_url,
          chatwoot_account_id: config.chatwoot_account_id,
          chatwoot_api_token: config.chatwoot_api_token,
        })
        .eq('id', config.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatwoot-config'] });
      toast.success('Configuração do Chatwoot salva!');
    },
    onError: (error) => {
      console.error('Erro ao salvar config Chatwoot:', error);
      toast.error('Erro ao salvar configuração do Chatwoot');
    },
  });
}

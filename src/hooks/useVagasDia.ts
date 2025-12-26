import { useQuery } from '@tanstack/react-query';
import { VagaDia } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useVagasDia() {
  return useQuery<VagaDia[]>({
    queryKey: ['vagasDia'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vagas_dia').select('*').order('data', { ascending: true });
      if (error) throw error;
      return data as VagaDia[];
    },
  });
}
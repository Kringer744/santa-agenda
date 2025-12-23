import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VagaDia } from '@/types';
// import { vagasDiaMock } from '@/data/mockData'; // Remove mock data import

export function useVagasDia() {
  return useQuery({
    queryKey: ['vagasDia'],
    queryFn: async () => {
      // Fetch from Supabase
      const { data, error } = await supabase
        .from('vagas_dia')
        .select('*')
        .order('data', { ascending: true });
      
      if (error) throw error;
      return data as VagaDia[];
    },
  });
}
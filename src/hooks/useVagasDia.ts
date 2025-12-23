import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VagaDia } from '@/types';
import { vagasDiaMock } from '@/data/mockData'; // Import mock data

export function useVagasDia() {
  return useQuery({
    queryKey: ['vagasDia'],
    queryFn: async () => {
      // Temporarily return mock data for illustration
      return vagasDiaMock as VagaDia[];

      // Uncomment the following lines to fetch from Supabase when ready
      // const { data, error } = await supabase
      //   .from('vagas_dia')
      //   .select('*')
      //   .order('data', { ascending: true });
      
      // if (error) throw error;
      // return data as VagaDia[];
    },
  });
}
import { useQuery } from '@tanstack/react-query';
import { AgendaDentista } from '@/types'; // Updated type
import { supabase } from '@/integrations/supabase/client';

export function useAgendaDia() { // Changed hook name
  return useQuery<AgendaDentista[]>({
    queryKey: ['agendaDia'], // Changed query key
    queryFn: async () => {
      const { data, error } = await supabase.from('agenda_dentista').select('*').order('data', { ascending: true }); // Changed table name
      if (error) throw error;
      return data as AgendaDentista[];
    },
  });
}
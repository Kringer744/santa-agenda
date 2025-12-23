import { useQuery } from '@tanstack/react-query';
import { VagaDia } from '@/types';
import { vagasDiaMock } from '@/data/mockData';

export function useVagasDia() {
  return useQuery({
    queryKey: ['vagasDia'],
    queryFn: async () => {
      // Usando dados fictícios
      return new Promise<VagaDia[]>((resolve) => {
        setTimeout(() => resolve(vagasDiaMock), 300);
      });
    },
  });
}
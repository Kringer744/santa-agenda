import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Reserva } from '@/types';
import { reservasMock } from '@/data/mockData';

export function useReservas() {
  return useQuery({
    queryKey: ['reservas'],
    queryFn: async () => {
      // Usando dados fictícios
      return new Promise<Reserva[]>((resolve) => {
        setTimeout(() => resolve(reservasMock), 300);
      });
    },
  });
}

export function useCreateReserva() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (reserva: Omit<Reserva, 'id' | 'created_at' | 'updated_at' | 'codigo_estadia'>) => {
      const codigoEstadia = `EST-${Date.now().toString(36).toUpperCase()}`;
      const newReserva = {
        ...reserva,
        id: `reserva-${Date.now()}`,
        codigo_estadia: codigoEstadia,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Reserva;
      
      // Simular delay de API
      return new Promise<Reserva>((resolve) => {
        setTimeout(() => resolve(newReserva), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      toast({
        title: 'Reserva criada com sucesso!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar reserva',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}

export function useUpdateReservaStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Reserva['status'] }) => {
      // Simular atualização de status
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id, status }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      toast({
        title: 'Status atualizado!'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive'
      });
    },
  });
}
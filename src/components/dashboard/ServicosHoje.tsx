import { Reserva, ServicoAdicional } from '@/types';

interface ServicosHojeProps {
  reservas: Reserva[];
}

export function ServicosHoje({ reservas }: ServicosHojeProps) {
  // Agrupa serviços contratados
  const servicosContagem: Record<string, { servico: ServicoAdicional; count: number }> = {};
  
  reservas.forEach(reserva => {
    reserva.servicosAdicionais.forEach(servico => {
      if (servicosContagem[servico.id]) {
        servicosContagem[servico.id].count++;
      } else {
        servicosContagem[servico.id] = { servico, count: 1 };
      }
    });
  });

  const servicosList = Object.values(servicosContagem);

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-slide-up">
      <h3 className="text-lg font-semibold text-foreground mb-4">Serviços Hoje</h3>
      
      {servicosList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum serviço agendado
        </p>
      ) : (
        <div className="space-y-3">
          {servicosList.map(({ servico, count }, index) => (
            <div 
              key={servico.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-honey-light/50"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-2xl">{servico.icone}</span>
              <div className="flex-1">
                <p className="font-medium text-foreground">{servico.nome}</p>
                <p className="text-sm text-muted-foreground">
                  R$ {servico.preco.toFixed(2)} por pet
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground">
                {count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

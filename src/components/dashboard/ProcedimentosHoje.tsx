import { Consulta, Procedimento } from '@/types'; // Updated types

interface ProcedimentosHojeProps {
  consultas: Consulta[]; // Changed from reservas
  procedimentos: Procedimento[]; // Changed from servicosAdicionais
}

export function ProcedimentosHoje({ consultas, procedimentos }: ProcedimentosHojeProps) {
  // Map procedimentos by ID for easy lookup
  const procedimentosMap = new Map(procedimentos.map(p => [p.id, p]));

  // Agrupa procedimentos contratados
  const procedimentosContagem: Record<string, { procedimento: Procedimento; count: number }> = {};
  
  consultas.forEach(consulta => {
    consulta.procedimentos.forEach(procedimentoId => { // Use procedimentos
      const procedimento = procedimentosMap.get(procedimentoId);
      if (procedimento) {
        if (procedimentosContagem[procedimento.id]) {
          procedimentosContagem[procedimento.id].count++;
        } else {
          procedimentosContagem[procedimento.id] = { procedimento, count: 1 };
        }
      }
    });
  });

  const procedimentosList = Object.values(procedimentosContagem);

  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 shadow-card animate-slide-up">
      <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">Procedimentos Realizados</h3>
      
      {procedimentosList.length === 0 ? (
        <p className="text-xs md:text-sm text-muted-foreground text-center py-8">
          Nenhum procedimento realizado hoje
        </p>
      ) : (
        <div className="space-y-3">
          {procedimentosList.map(({ procedimento, count }, index) => (
            <div 
              key={procedimento.id}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-honey-light/50"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-xl md:text-2xl">{procedimento.icone}</span>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm md:text-base">{procedimento.nome}</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  R$ {procedimento.preco.toFixed(2)} por procedimento
                </p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground text-sm md:text-base">
                {count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Stethoscope } from 'lucide-react'; 
import { Dentista } from '@/types'; 
import { useCreateDentista } from '@/hooks/useDentistas'; 
import { toast } from 'sonner';

interface DentistaSelectorAndCreatorProps {
  selectedPacienteId: string | undefined; 
  selectedDentistaId: string | undefined; 
  onSelectDentista: (dentistaId: string) => void; 
  dentistas: Dentista[]; 
  isLoadingDentistas: boolean; 
}

export function DentistaSelectorAndCreator({
  selectedPacienteId,
  selectedDentistaId,
  onSelectDentista,
  dentistas,
  isLoadingDentistas,
}: DentistaSelectorAndCreatorProps) {
  const [showNewDentistaForm, setShowNewDentistaForm] = useState(false);
  const createDentista = useCreateDentista(); 

  const availableDentistas = useMemo(() => dentistas, [dentistas]); 

  const handleCreateNewDentista = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPacienteId) { 
      toast.error('Selecione um paciente primeiro.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    try {
      const newDentista = await createDentista.mutateAsync({
        nome: formData.get('nome') as string,
        cro: formData.get('cro') as string,
        especialidade: formData.get('especialidade') as string || null,
        telefone: formData.get('telefone') as string || null,
        email: formData.get('email') as string || null,
        google_calendar_id: null, // Adicionado para satisfazer o tipo
      });
      toast.success('Dentista cadastrado com sucesso!');
      onSelectDentista(newDentista.id);
      setShowNewDentistaForm(false);
    } catch (error: any) {
      toast.error(`Erro ao cadastrar dentista: ${error.message}`);
    }
  };

  if (!selectedPacienteId) {
    return (
      <div className="text-muted-foreground text-sm text-center py-4">
        Selecione um paciente para ver ou cadastrar dentistas.
      </div>
    );
  }

  if (isLoadingDentistas) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dentista_id">Dentista</Label>
        <Select 
          value={selectedDentistaId} 
          onValueChange={onSelectDentista}
          disabled={availableDentistas.length === 0 && showNewDentistaForm}
        >
          <SelectTrigger>
            <SelectValue placeholder={availableDentistas.length > 0 ? "Selecione o dentista" : "Nenhum dentista cadastrado"} />
          </SelectTrigger>
          <SelectContent>
            {availableDentistas.map(dentista => (
              <SelectItem key={dentista.id} value={dentista.id}>
                <Stethoscope className="w-4 h-4 inline-block mr-2" /> {dentista.nome} ({dentista.especialidade})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(availableDentistas.length === 0 || !selectedDentistaId) && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowNewDentistaForm(!showNewDentistaForm)}
            className="w-full"
          >
            {showNewDentistaForm ? 'Cancelar Cadastro' : 'Cadastrar Novo Dentista'}
          </Button>
        </div>
      )}

      {showNewDentistaForm && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              Novo Dentista
            </h4>
            <form onSubmit={handleCreateNewDentista} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_dentista_nome">Nome do dentista</Label>
                <Input id="new_dentista_nome" name="nome" required placeholder="Nome do dentista" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_dentista_cro">CRO</Label>
                  <Input id="new_dentista_cro" name="cro" required placeholder="CRO/UF 12345" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_dentista_especialidade">Especialidade (opcional)</Label>
                  <Select name="especialidade">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Clínico Geral</SelectItem>
                      <SelectItem value="ortodontia">Ortodontia</SelectItem>
                      <SelectItem value="implantodontia">Implantodontia</SelectItem>
                      <SelectItem value="endodontia">Endodontia</SelectItem>
                      <SelectItem value="periodontia">Periodontia</SelectItem>
                      <SelectItem value="harmonizacao">Harmonização Facial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_dentista_telefone">Telefone (opcional)</Label>
                <Input id="new_dentista_telefone" name="telefone" placeholder="11999999999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_dentista_email">E-mail (opcional)</Label>
                <Input id="new_dentista_email" name="email" type="email" placeholder="email@dentista.com" />
              </div>
              <Button type="submit" className="w-full" disabled={createDentista.isPending}>
                {createDentista.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Cadastrar Dentista'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
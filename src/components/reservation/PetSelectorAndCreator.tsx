import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, PawPrint, Plus } from 'lucide-react';
import { Pet } from '@/types';
import { useCreatePet } from '@/hooks/usePets';
import { toast } from 'sonner';

interface PetSelectorAndCreatorProps {
  selectedTutorId: string | undefined;
  selectedPetId: string | undefined;
  onSelectPet: (petId: string) => void;
  pets: Pet[];
  isLoadingPets: boolean;
}

export function PetSelectorAndCreator({
  selectedTutorId,
  selectedPetId,
  onSelectPet,
  pets,
  isLoadingPets,
}: PetSelectorAndCreatorProps) {
  const [showNewPetForm, setShowNewPetForm] = useState(false);
  const createPet = useCreatePet();

  const tutorPets = useMemo(() => pets.filter(p => p.tutor_id === selectedTutorId), [pets, selectedTutorId]);

  const handleCreateNewPet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTutorId) {
      toast.error('Selecione um tutor primeiro.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    try {
      const newPet = await createPet.mutateAsync({
        tutor_id: selectedTutorId,
        nome: formData.get('nome') as string,
        especie: formData.get('especie') as 'cachorro' | 'gato',
        raca: formData.get('raca') as string || null,
        porte: formData.get('porte') as 'pequeno' | 'medio' | 'grande' || null,
        idade: parseInt(formData.get('idade') as string) || null,
        data_nascimento: formData.get('data_nascimento') as string || null,
        necessidades_especiais: formData.get('necessidades_especiais') as string || null,
        observacoes_comportamentais: formData.get('observacoes_comportamentais') as string || null,
      });
      toast.success('Pet cadastrado com sucesso!');
      onSelectPet(newPet.id);
      setShowNewPetForm(false);
    } catch (error: any) {
      toast.error(`Erro ao cadastrar pet: ${error.message}`);
    }
  };

  if (!selectedTutorId) {
    return (
      <div className="text-muted-foreground text-sm text-center py-4">
        Selecione um tutor para ver ou cadastrar pets.
      </div>
    );
  }

  if (isLoadingPets) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pet_id">Pet</Label>
        <Select 
          value={selectedPetId} 
          onValueChange={onSelectPet}
          disabled={tutorPets.length === 0 && showNewPetForm} // Disable if no pets and new form is open
        >
          <SelectTrigger>
            <SelectValue placeholder={tutorPets.length > 0 ? "Selecione o pet" : "Nenhum pet cadastrado"} />
          </SelectTrigger>
          <SelectContent>
            {tutorPets.map(pet => (
              <SelectItem key={pet.id} value={pet.id}>
                {pet.especie === 'cachorro' ? '🐶' : '🐱'} {pet.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(tutorPets.length === 0 || !selectedPetId) && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowNewPetForm(!showNewPetForm)}
            className="w-full"
          >
            {showNewPetForm ? 'Cancelar Cadastro' : 'Cadastrar Novo Pet'}
          </Button>
        </div>
      )}

      {showNewPetForm && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-primary" />
              Novo Pet
            </h4>
            <form onSubmit={handleCreateNewPet} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_pet_nome">Nome do pet</Label>
                <Input id="new_pet_nome" name="nome" required placeholder="Nome do seu pet" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_pet_especie">Espécie</Label>
                  <Select name="especie" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cachorro">🐶 Cachorro</SelectItem>
                      <SelectItem value="gato">🐱 Gato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_pet_porte">Porte</Label>
                  <Select name="porte">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pequeno">Pequeno</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_pet_raca">Raça (opcional)</Label>
                  <Input id="new_pet_raca" name="raca" placeholder="Ex: Golden Retriever" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_pet_idade">Idade (anos, opcional)</Label>
                  <Input id="new_pet_idade" name="idade" type="number" min="0" placeholder="Ex: 3" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_pet_data_nascimento">Data de Nascimento (opcional)</Label>
                <Input id="new_pet_data_nascimento" name="data_nascimento" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_pet_necessidades_especiais">Necessidades especiais (opcional)</Label>
                <Textarea id="new_pet_necessidades_especiais" name="necessidades_especiais" placeholder="Ex: medicação diária, dieta especial..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_pet_observacoes_comportamentais">Observações comportamentais (opcional)</Label>
                <Textarea id="new_pet_observacoes_comportamentais" name="observacoes_comportamentais" placeholder="Ex: não se dá bem com outros cães..." />
              </div>
              <Button type="submit" className="w-full" disabled={createPet.isPending}>
                {createPet.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Cadastrar Pet'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
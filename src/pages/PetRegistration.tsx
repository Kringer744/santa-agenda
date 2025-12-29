import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, PawPrint } from 'lucide-react';
import { useCreatePet } from '@/hooks/usePets';
import { useTutores } from '@/hooks/useTutores';
import { toast } from 'sonner';

export default function PetRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTutorId = searchParams.get('tutor_id');

  const [selectedTutorId, setSelectedTutorId] = useState<string | undefined>(initialTutorId || undefined);
  const createPet = useCreatePet();
  const { data: tutores = [], isLoading: loadingTutores } = useTutores();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTutor = useMemo(() => tutores.find(t => t.id === selectedTutorId), [tutores, selectedTutorId]);

  const handleRegisterPet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTutorId) {
      toast.error('Por favor, selecione um tutor.');
      return;
    }
    setIsSubmitting(true);
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
      toast.success('Pet cadastrado com sucesso! Agora você pode reservar.');
      navigate(`/client-reservation?tutor_id=${selectedTutorId}&pet_id=${newPet.id}`);
    } catch (error: any) {
      toast.error(`Erro ao cadastrar pet: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingTutores) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-8 py-8">
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Cadastre seu Pet</h1>
          <p className="text-muted-foreground mt-2">
            Precisamos saber um pouco sobre seu amigo de quatro patas.
          </p>
        </div>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-primary" />
              Informações do Pet
            </CardTitle>
            <CardDescription>Preencha os dados do seu pet para prosseguir com a reserva.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegisterPet} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tutor_id">Tutor</Label>
                <Select 
                  value={selectedTutorId} 
                  onValueChange={setSelectedTutorId}
                  disabled={!!initialTutorId} // Disable if tutor_id came from URL
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tutor" />
                  </SelectTrigger>
                  <SelectContent>
                    {tutores.map(tutor => (
                      <SelectItem key={tutor.id} value={tutor.id}>
                        {tutor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do pet</Label>
                <Input id="nome" name="nome" required placeholder="Nome do seu pet" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="especie">Espécie</Label>
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
                  <Label htmlFor="porte">Porte</Label>
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
                  <Label htmlFor="raca">Raça (opcional)</Label>
                  <Input id="raca" name="raca" placeholder="Ex: Golden Retriever" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idade">Idade (anos, opcional)</Label>
                  <Input id="idade" name="idade" type="number" min="0" placeholder="Ex: 3" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento (opcional)</Label>
                <Input id="data_nascimento" name="data_nascimento" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="necessidades_especiais">Necessidades especiais (opcional)</Label>
                <Textarea id="necessidades_especiais" name="necessidades_especiais" placeholder="Ex: medicação diária, dieta especial..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes_comportamentais">Observações comportamentais (opcional)</Label>
                <Textarea id="observacoes_comportamentais" name="observacoes_comportamentais" placeholder="Ex: não se dá bem com outros cães..." />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting || !selectedTutorId}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Cadastrar Pet e Reservar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
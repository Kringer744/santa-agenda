import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, UserPlus, Users } from 'lucide-react';
import { Tutor } from '@/types';
import { useCreateTutor } from '@/hooks/useTutores';
import { toast } from 'sonner';

interface TutorSelectorAndCreatorProps {
  selectedTutorId: string | undefined;
  onSelectTutor: (tutorId: string) => void;
  tutores: Tutor[];
  isLoadingTutores: boolean;
}

export function TutorSelectorAndCreator({
  selectedTutorId,
  onSelectTutor,
  tutores,
  isLoadingTutores,
}: TutorSelectorAndCreatorProps) {
  const [showNewTutorForm, setShowNewTutorForm] = useState(false);
  const createTutor = useCreateTutor();

  const handleCreateNewTutor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const newTutor = await createTutor.mutateAsync({
        nome: formData.get('nome') as string,
        cpf: formData.get('cpf') as string,
        telefone: formData.get('telefone') as string,
        email: formData.get('email') as string || null,
        data_nascimento: formData.get('data_nascimento') as string || null,
        tags: ['cliente-web'],
      });
      toast.success('Tutor cadastrado com sucesso!');
      onSelectTutor(newTutor.id);
      setShowNewTutorForm(false);
    } catch (error: any) {
      toast.error(`Erro ao cadastrar tutor: ${error.message}`);
    }
  };

  if (isLoadingTutores) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tutor_id">Tutor</Label>
        <Select 
          value={selectedTutorId} 
          onValueChange={onSelectTutor}
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

      {!selectedTutorId && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setShowNewTutorForm(!showNewTutorForm)}
            className="w-full"
          >
            {showNewTutorForm ? 'Cancelar Cadastro' : 'Cadastrar Novo Tutor'}
          </Button>
        </div>
      )}

      {showNewTutorForm && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Novo Tutor
            </h4>
            <form onSubmit={handleCreateNewTutor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_tutor_nome">Nome completo</Label>
                <Input id="new_tutor_nome" name="nome" required placeholder="Seu Nome Completo" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_tutor_cpf">CPF</Label>
                  <Input id="new_tutor_cpf" name="cpf" required placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_tutor_telefone">WhatsApp</Label>
                  <Input id="new_tutor_telefone" name="telefone" required placeholder="5511999999999" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_tutor_email">E-mail (opcional)</Label>
                <Input id="new_tutor_email" name="email" type="email" placeholder="seu.email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_tutor_data_nascimento">Data de nascimento (opcional)</Label>
                <Input id="new_tutor_data_nascimento" name="data_nascimento" type="date" />
              </div>
              <Button type="submit" className="w-full" disabled={createTutor.isPending}>
                {createTutor.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Cadastrar Tutor'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
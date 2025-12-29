import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserPlus } from 'lucide-react';
import { useCreateTutor } from '@/hooks/useTutores';
import { toast } from 'sonner';

export default function ClientRegistration() {
  const navigate = useNavigate();
  const createTutor = useCreateTutor();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegisterTutor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const newTutor = await createTutor.mutateAsync({
        nome: formData.get('nome') as string,
        cpf: formData.get('cpf') as string,
        telefone: formData.get('telefone') as string,
        email: formData.get('email') as string || null,
        data_nascimento: formData.get('data_nascimento') as string || null,
        tags: ['cliente-web'], // Adiciona uma tag para identificar o cadastro via web
      });
      toast.success('Cadastro realizado com sucesso! Agora cadastre seu pet.');
      navigate(`/pet-registration?tutor_id=${newTutor.id}`);
    } catch (error: any) {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-8 py-8">
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Cadastre-se</h1>
          <p className="text-muted-foreground mt-2">
            Crie sua conta para reservar a hospedagem do seu pet.
          </p>
        </div>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Suas Informações
            </CardTitle>
            <CardDescription>Preencha seus dados para criar seu perfil de tutor.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegisterTutor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" name="nome" required placeholder="Seu Nome Completo" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" name="cpf" required placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">WhatsApp</Label>
                  <Input id="telefone" name="telefone" required placeholder="5511999999999" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input id="email" name="email" type="email" placeholder="seu.email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de nascimento (opcional)</Label>
                <Input id="data_nascimento" name="data_nascimento" type="date" />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Continuar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Phone, Mail, Calendar, Trash2, Loader2 } from 'lucide-react';
import { useTutores, useCreateTutor, useDeleteTutor } from '@/hooks/useTutores';
import { usePets } from '@/hooks/usePets';

export default function Tutores() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: tutores = [], isLoading } = useTutores();
  const { data: pets = [] } = usePets();
  const createTutor = useCreateTutor();
  const deleteTutor = useDeleteTutor();
  
  const filteredTutores = tutores.filter(tutor => 
    tutor.nome.toLowerCase().includes(search.toLowerCase()) ||
    tutor.cpf.includes(search) ||
    tutor.telefone.includes(search)
  );

  const getPetsByTutor = (tutorId: string) => 
    pets.filter(pet => pet.tutor_id === tutorId);

  const handleAddTutor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTutor.mutate({
      nome: formData.get('nome') as string,
      cpf: formData.get('cpf') as string,
      telefone: formData.get('telefone') as string,
      email: formData.get('email') as string,
      data_nascimento: formData.get('dataNascimento') as string || null,
      tags: ['novo'],
    }, {
      onSuccess: () => setIsDialogOpen(false)
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tutores</h1>
            <p className="text-muted-foreground mt-1">
              {tutores.length} tutores cadastrados
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Tutor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Tutor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTutor} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" name="nome" required placeholder="Maria Silva" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" name="cpf" required placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">WhatsApp</Label>
                    <Input id="telefone" name="telefone" required placeholder="11999999999" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" placeholder="maria@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de nascimento</Label>
                  <Input id="dataNascimento" name="dataNascimento" type="date" />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createTutor.isPending}>
                    {createTutor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md animate-slide-up">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, CPF ou telefone..."
            className="pl-12 h-12 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTutores.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum tutor encontrado</p>
          </div>
        ) : (
          /* Tutores Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutores.map((tutor, index) => {
              const tutorPets = getPetsByTutor(tutor.id);
              
              return (
                <div 
                  key={tutor.id}
                  className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center text-2xl font-bold text-primary-foreground">
                      {tutor.nome.charAt(0)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {tutor.tags?.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteTutor.mutate(tutor.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground">{tutor.nome}</h3>
                  <p className="text-sm text-muted-foreground">CPF: {tutor.cpf}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{tutor.telefone}</span>
                    </div>
                    {tutor.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{tutor.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Cliente desde {new Date(tutor.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {tutorPets.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Pets cadastrados</p>
                      <div className="flex gap-2 flex-wrap">
                        {tutorPets.map(pet => (
                          <Badge key={pet.id} className="bg-coral-light text-primary">
                            {pet.especie === 'cachorro' ? '🐶' : '🐱'} {pet.nome}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

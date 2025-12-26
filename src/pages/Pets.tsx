import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { usePets, useCreatePet, useDeletePet } from '@/hooks/usePets';
import { useTutores } from '@/hooks/useTutores';
import { cn } from '@/lib/utils';

export default function Pets() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: pets = [], isLoading } = usePets();
  const { data: tutores = [] } = useTutores();
  const createPet = useCreatePet();
  const deletePet = useDeletePet();

  const getTutor = (tutorId: string) => 
    tutores.find(t => t.id === tutorId);

  const filteredPets = pets.filter(pet => {
    const matchSearch = pet.nome.toLowerCase().includes(search.toLowerCase()) ||
      (pet.raca?.toLowerCase().includes(search.toLowerCase()) ?? false);
    
    if (activeTab === 'todos') return matchSearch;
    return matchSearch && pet.especie === activeTab;
  });

  const porteColors: Record<string, string> = {
    pequeno: 'bg-mint-light text-secondary',
    medio: 'bg-honey-light text-accent-foreground',
    grande: 'bg-coral-light text-primary',
  };

  const handleAddPet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPet.mutate({
      tutor_id: formData.get('tutor_id') as string,
      nome: formData.get('nome') as string,
      especie: formData.get('especie') as 'cachorro' | 'gato',
      raca: formData.get('raca') as string || null,
      porte: formData.get('porte') as 'pequeno' | 'medio' | 'grande' || null,
      idade: parseInt(formData.get('idade') as string) || null,
      data_nascimento: formData.get('data_nascimento') as string || null,
      necessidades_especiais: formData.get('necessidades_especiais') as string || null,
      observacoes_comportamentais: formData.get('observacoes_comportamentais') as string || null,
    }, {
      onSuccess: () => setIsDialogOpen(false)
    });
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pets</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {pets.length} pets cadastrados
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo Pet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Pet</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPet} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="tutor_id">Tutor</Label>
                  <Select name="tutor_id" required>
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
                  <Input id="nome" name="nome" required placeholder="Rex" />
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
                    <Label htmlFor="raca">Raça</Label>
                    <Input id="raca" name="raca" placeholder="Golden Retriever" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idade">Idade (anos)</Label>
                    <Input id="idade" name="idade" type="number" min="0" placeholder="3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input id="data_nascimento" name="data_nascimento" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="necessidades_especiais">Necessidades especiais</Label>
                  <Textarea id="necessidades_especiais" name="necessidades_especiais" placeholder="Ex: medicação diária, dieta especial..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes_comportamentais">Observações comportamentais</Label>
                  <Textarea id="observacoes_comportamentais" name="observacoes_comportamentais" placeholder="Ex: não se dá bem com outros cães..." />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createPet.isPending}>
                    {createPet.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 animate-slide-up">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-muted grid grid-cols-3"> {/* Ajustado para 3 colunas no mobile */}
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="cachorro">🐶 Cachorros</TabsTrigger>
              <TabsTrigger value="gato">🐱 Gatos</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 max-w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou raça..."
              className="pl-12 h-10 rounded-xl w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum pet encontrado</p>
          </div>
        ) : (
          /* Pets Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredPets.map((pet, index) => {
              const tutor = getTutor(pet.tutor_id);
              
              return (
                <div 
                  key={pet.id}
                  className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Pet Avatar */}
                  <div className={cn(
                    "h-32 flex items-center justify-center text-6xl transition-transform duration-300 group-hover:scale-110 relative",
                    pet.especie === 'cachorro' ? 'bg-coral-light' : 'bg-mint-light'
                  )}>
                    {pet.especie === 'cachorro' ? '🐶' : '🐱'}
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute top-2 right-2 h-8 w-8 text-destructive bg-background/80"
                      onClick={() => deletePet.mutate(pet.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-foreground">{pet.nome}</h3>
                      {pet.porte && (
                        <Badge className={cn("text-xs", porteColors[pet.porte])}>
                          {pet.porte}
                        </Badge>
                      )}
                    </div>
                    
                    {pet.raca && <p className="text-sm text-muted-foreground">{pet.raca}</p>}
                    {pet.idade && (
                      <p className="text-sm text-muted-foreground">
                        {pet.idade} {pet.idade === 1 ? 'ano' : 'anos'}
                      </p>
                    )}
                    
                    {pet.necessidades_especiais && (
                      <div className="mt-3 p-2 rounded-lg bg-blush-light">
                        <p className="text-xs text-blush font-medium">🩺 {pet.necessidades_especiais}</p>
                      </div>
                    )}
                    
                    {pet.observacoes_comportamentais && (
                      <p className="mt-3 text-xs text-muted-foreground italic">
                        "{pet.observacoes_comportamentais}"
                      </p>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">Tutor</p>
                      <p className="text-sm font-medium text-foreground">{tutor?.nome || 'Não encontrado'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
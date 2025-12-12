import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import { petsMock, tutoresMock } from '@/data/mockData';
import { Pet } from '@/types';
import { cn } from '@/lib/utils';

export default function Pets() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  
  const getTutor = (tutorId: string) => 
    tutoresMock.find(t => t.id === tutorId);

  const filteredPets = petsMock.filter(pet => {
    const matchSearch = pet.nome.toLowerCase().includes(search.toLowerCase()) ||
      pet.raca.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'todos') return matchSearch;
    return matchSearch && pet.especie === activeTab;
  });

  const porteColors = {
    pequeno: 'bg-mint-light text-secondary',
    medio: 'bg-honey-light text-accent-foreground',
    grande: 'bg-coral-light text-primary',
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pets</h1>
            <p className="text-muted-foreground mt-1">
              {petsMock.length} pets cadastrados
            </p>
          </div>
          
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Pet
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 animate-slide-up">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-muted">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="cachorro">🐶 Cachorros</TabsTrigger>
              <TabsTrigger value="gato">🐱 Gatos</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou raça..."
              className="pl-12 h-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Pets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPets.map((pet, index) => {
            const tutor = getTutor(pet.tutorId);
            
            return (
              <div 
                key={pet.id}
                className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Pet Avatar */}
                <div className={cn(
                  "h-32 flex items-center justify-center text-6xl transition-transform duration-300 group-hover:scale-110",
                  pet.especie === 'cachorro' ? 'bg-coral-light' : 'bg-mint-light'
                )}>
                  {pet.especie === 'cachorro' ? '🐶' : '🐱'}
                </div>
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-foreground">{pet.nome}</h3>
                    <Badge className={cn("text-xs", porteColors[pet.porte])}>
                      {pet.porte}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{pet.raca}</p>
                  <p className="text-sm text-muted-foreground">{pet.idade} {pet.idade === 1 ? 'ano' : 'anos'}</p>
                  
                  {pet.necessidadesEspeciais && (
                    <div className="mt-3 p-2 rounded-lg bg-blush-light">
                      <p className="text-xs text-blush font-medium">🩺 {pet.necessidadesEspeciais}</p>
                    </div>
                  )}
                  
                  {pet.observacoesComportamentais && (
                    <p className="mt-3 text-xs text-muted-foreground italic">
                      "{pet.observacoesComportamentais}"
                    </p>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">Tutor</p>
                    <p className="text-sm font-medium text-foreground">{tutor?.nome}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

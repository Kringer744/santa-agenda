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
import { Plus, Search, Trash2, Loader2, Smile, Mail, Phone } from 'lucide-react'; 
import { useDentistas, useCreateDentista, useDeleteDentista } from '@/hooks/useDentistas';
import { cn } from '@/lib/utils';

export default function Dentistas() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: dentistas = [], isLoading } = useDentistas();
  const createDentista = useCreateDentista();
  const deleteDentista = useDeleteDentista();

  const filteredDentistas = dentistas.filter(dentista => {
    const matchSearch = dentista.nome.toLowerCase().includes(search.toLowerCase()) ||
      (dentista.especialidade?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      dentista.cro.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'todos') return matchSearch;
    return matchSearch && dentista.especialidade === activeTab;
  });

  const especialidadeColors: Record<string, string> = {
    geral: 'bg-mint-light text-secondary',
    ortodontia: 'bg-honey-light text-accent-foreground',
    implantodontia: 'bg-coral-light text-primary',
    endodontia: 'bg-blush-light text-blush',
  };

  const handleAddDentista = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createDentista.mutate({
      nome: formData.get('nome') as string,
      cro: formData.get('cro') as string,
      especialidade: formData.get('especialidade') as string || null,
      telefone: formData.get('telefone') as string || null,
      email: formData.get('email') as string || null,
      google_calendar_id: null, // Adicionado para satisfazer o tipo
    }, {
      onSuccess: () => setIsDialogOpen(false)
    });
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dentistas</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {dentistas.length} dentistas cadastrados
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo Dentista
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Dentista</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDentista} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do dentista</Label>
                  <Input id="nome" name="nome" required placeholder="Dr. João Silva" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cro">CRO</Label>
                    <Input id="cro" name="cro" required placeholder="CRO/SP 12345" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="especialidade">Especialidade</Label>
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
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" name="telefone" placeholder="11999999999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" placeholder="dr.joao@clinica.com" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createDentista.isPending}>
                    {createDentista.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col md:flex-row gap-4 animate-slide-up">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-muted grid grid-cols-3">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="geral">Clínico Geral</TabsTrigger>
              <TabsTrigger value="ortodontia">Ortodontia</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 max-w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, CRO ou especialidade..."
              className="pl-12 h-10 rounded-xl w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredDentistas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum dentista encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredDentistas.map((dentista, index) => {
              return (
                <div 
                  key={dentista.id}
                  className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    "h-32 flex items-center justify-center text-6xl transition-transform duration-300 group-hover:scale-110 relative",
                    dentista.especialidade === 'ortodontia' ? 'bg-mint-light' : 'bg-coral-light'
                  )}>
                    <Smile className="w-12 h-12 text-primary-foreground" />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute top-2 right-2 h-8 w-8 text-destructive bg-background/80"
                      onClick={() => deleteDentista.mutate(dentista.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-foreground">{dentista.nome}</h3>
                      {dentista.especialidade && (
                        <Badge className={cn("text-xs", especialidadeColors[dentista.especialidade])}>
                          {dentista.especialidade}
                        </Badge>
                      )}
                    </div>
                    
                    {dentista.cro && <p className="text-sm text-muted-foreground">{dentista.cro}</p>}
                    
                    <div className="mt-3 space-y-2">
                      {dentista.telefone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{dentista.telefone}</span>
                        </div>
                      )}
                      {dentista.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{dentista.email}</span>
                        </div>
                      )}
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
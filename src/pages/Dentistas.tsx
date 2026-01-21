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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

export default function Dentistas() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: dentistas = [], isLoading } = useDentistas();
  const createDentista = useCreateDentista();
  const deleteDentista = useDeleteDentista();

  const filteredDentistas = dentistas.filter(dentista => 
    dentista.nome.toLowerCase().includes(search.toLowerCase()) ||
    (dentista.especialidade?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    dentista.cro.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddDentista = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createDentista.mutate({
      nome: formData.get('nome') as string,
      cro: formData.get('cro') as string,
      especialidade: formData.get('especialidade') as string || null,
      telefone: formData.get('telefone') as string || null,
      email: formData.get('email') as string || null,
      google_calendar_id: null,
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
              Corpo clínico da DentalClinic
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

        <div className="relative max-w-full md:max-w-md animate-slide-up">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, CRO ou especialidade..."
            className="pl-12 h-10 rounded-xl w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
            {filteredDentistas.map((dentista, index) => (
              <div 
                key={dentista.id}
                className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up border border-border/50 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="h-24 bg-primary/5 flex items-center justify-center relative">
                  <Smile className="w-10 h-10 text-primary" />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute top-2 right-2 h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Dentista</AlertDialogTitle>
                        <AlertDialogDescription>
                          Deseja remover {dentista.nome}? Isso pode afetar agendas vinculadas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteDentista.mutate(dentista.id)} className="bg-destructive text-white">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                
                <div className="p-5">
                  <h3 className="text-lg font-bold text-foreground">{dentista.nome}</h3>
                  <Badge variant="secondary" className="mt-1">{dentista.especialidade || 'Geral'}</Badge>
                  
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2"><Phone size={12} /> {dentista.telefone || 'N/A'}</p>
                    <p className="flex items-center gap-2"><Mail size={12} /> {dentista.email || 'N/A'}</p>
                    <p className="font-medium mt-2">CRO: {dentista.cro}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
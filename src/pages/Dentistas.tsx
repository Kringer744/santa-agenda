import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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
import { Plus, Search, Loader2, Phone, Stethoscope, Edit, Trash2 } from 'lucide-react'; 
import { useDentistas, useCreateDentista, useUpdateDentista, useDeleteDentista } from '@/hooks/useDentistas';
import { useProcedimentos } from '@/hooks/useProcedimentos';
import { Dentista } from '@/types';

export default function Dentistas() {
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDentista, setEditingDentista] = useState<Dentista | null>(null);
  const [selectedProcs, setSelectedProcs] = useState<string[]>([]);
  
  const { data: dentistas = [], isLoading } = useDentistas();
  const { data: procedimentos = [] } = useProcedimentos();
  const createDentista = useCreateDentista();
  const updateDentista = useUpdateDentista();
  const deleteDentista = useDeleteDentista();

  const filteredDentistas = dentistas.filter(dentista => 
    dentista.nome.toLowerCase().includes(search.toLowerCase()) ||
    (dentista.especialidade?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    dentista.cro.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleProc = (id: string) => {
    setSelectedProcs(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleOpenEdit = (dentista: Dentista) => {
    setEditingDentista(dentista);
    setSelectedProcs(dentista.procedimentos || []);
    setIsEditDialogOpen(true);
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
      google_calendar_id: null,
      procedimentos: selectedProcs,
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setSelectedProcs([]);
      }
    });
  };

  const handleUpdateDentista = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDentista) return;

    const formData = new FormData(e.currentTarget);
    updateDentista.mutate({
      id: editingDentista.id,
      nome: formData.get('nome') as string,
      cro: formData.get('cro') as string,
      especialidade: formData.get('especialidade') as string || null,
      telefone: formData.get('telefone') as string || null,
      email: formData.get('email') as string || null,
      procedimentos: selectedProcs,
    }, {
      onSuccess: () => setIsEditDialogOpen(false)
    });
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dentistas</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Corpo clínico da DentalClinic</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" /> Novo Dentista
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                  <Label>Procedimentos Realizados</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                    {procedimentos.map(proc => (
                      <div key={proc.id} className="flex items-center gap-2">
                        <Checkbox 
                          id={`proc-${proc.id}`} 
                          checked={selectedProcs.includes(proc.id)}
                          onCheckedChange={() => handleToggleProc(proc.id)}
                        />
                        <label htmlFor={`proc-${proc.id}`} className="text-xs cursor-pointer">{proc.nome}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" name="telefone" placeholder="11999999999" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" name="email" type="email" placeholder="dr.joao@clinica.com" />
                  </div>
                </div>
                
                <DialogFooter className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="flex-1" disabled={createDentista.isPending}>
                    {createDentista.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Dentista'}
                  </Button>
                </DialogFooter>
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
                  <Stethoscope className="w-10 h-10 text-primary" />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="h-8 w-8 shadow-sm" onClick={() => handleOpenEdit(dentista)}>
                      <Edit size={14} className="text-primary" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="secondary" className="h-8 w-8 shadow-sm">
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Dentista?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja remover {dentista.nome} do sistema? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDentista.mutate(dentista.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Confirmar Exclusão
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-foreground">{dentista.nome}</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase">{dentista.especialidade || 'Geral'}</Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground border-b pb-3 mb-3">
                    <p className="flex items-center gap-2"><Phone size={12} /> {dentista.telefone || 'N/A'}</p>
                    <p className="font-medium">CRO: {dentista.cro}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Procedimentos:</p>
                    <div className="flex flex-wrap gap-1">
                      {(dentista.procedimentos || []).map(pid => {
                        const proc = procedimentos.find(p => p.id === pid);
                        return proc ? <Badge key={pid} variant="outline" className="text-[9px] px-1 h-4">{proc.nome}</Badge> : null;
                      })}
                      {(dentista.procedimentos || []).length === 0 && <span className="text-[10px] text-muted-foreground italic">Nenhum vinculado</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Dados do Dentista</DialogTitle>
            </DialogHeader>
            {editingDentista && (
              <form onSubmit={handleUpdateDentista} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_nome">Nome do dentista</Label>
                  <Input id="edit_nome" name="nome" required defaultValue={editingDentista.nome} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_cro">CRO</Label>
                    <Input id="edit_cro" name="cro" required defaultValue={editingDentista.cro} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_especialidade">Especialidade</Label>
                    <Select name="especialidade" defaultValue={editingDentista.especialidade || 'geral'}>
                      <SelectTrigger>
                        <SelectValue />
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
                  <Label>Procedimentos Realizados</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
                    {procedimentos.map(proc => (
                      <div key={proc.id} className="flex items-center gap-2">
                        <Checkbox 
                          id={`edit-proc-${proc.id}`} 
                          checked={selectedProcs.includes(proc.id)}
                          onCheckedChange={() => handleToggleProc(proc.id)}
                        />
                        <label htmlFor={`edit-proc-${proc.id}`} className="text-xs cursor-pointer">{proc.nome}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_telefone">Telefone</Label>
                    <Input id="edit_telefone" name="telefone" defaultValue={editingDentista.telefone || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_email">E-mail</Label>
                    <Input id="edit_email" name="email" type="email" defaultValue={editingDentista.email || ''} />
                  </div>
                </div>
                
                <DialogFooter className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="flex-1" disabled={updateDentista.isPending}>
                    {updateDentista.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
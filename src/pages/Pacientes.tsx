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
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Importar Textarea
import { Plus, Search, Phone, Mail, Calendar, Trash2, Loader2, Smile, Edit } from 'lucide-react'; 
import { usePacientes, useCreatePaciente, useDeletePaciente, useUpdatePaciente } from '@/hooks/usePacientes'; // Importar useUpdatePaciente
import { useConsultas } from '@/hooks/useConsultas';
import { Paciente } from '@/types'; // Importar tipo Paciente

export default function Pacientes() {
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  
  const { data: pacientes = [], isLoading } = usePacientes();
  const { data: consultas = [] } = useConsultas();
  const createPaciente = useCreatePaciente();
  const deletePaciente = useDeletePaciente();
  const updatePaciente = useUpdatePaciente(); // Novo hook de atualização
  
  const filteredPacientes = pacientes.filter(paciente => 
    paciente.nome.toLowerCase().includes(search.toLowerCase()) ||
    paciente.cpf.includes(search) ||
    paciente.telefone.includes(search)
  );

  const getConsultasByPaciente = (pacienteId: string) => 
    consultas.filter(consulta => consulta.paciente_id === pacienteId);

  const handleAddPaciente = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPaciente.mutate({
      nome: formData.get('nome') as string,
      cpf: formData.get('cpf') as string,
      telefone: formData.get('telefone') as string,
      email: formData.get('email') as string || null,
      data_nascimento: formData.get('data_nascimento') as string || null,
      tags: ['novo'],
      observacoes: null, // Novo campo
    }, {
      onSuccess: () => setIsCreateDialogOpen(false)
    });
  };

  const handleEditPaciente = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPaciente) return;

    const formData = new FormData(e.currentTarget);
    updatePaciente.mutate({
      id: editingPaciente.id,
      nome: formData.get('nome') as string,
      cpf: formData.get('cpf') as string,
      telefone: formData.get('telefone') as string,
      email: formData.get('email') as string || null,
      data_nascimento: formData.get('data_nascimento') as string || null,
      observacoes: formData.get('observacoes') as string || null, // Novo campo
    }, {
      onSuccess: () => setIsEditDialogOpen(false)
    });
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pacientes</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {pacientes.length} pacientes cadastrados
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Novo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Paciente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPaciente} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" name="nome" required placeholder="Maria Silva" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <Label htmlFor="data_nascimento">Data de nascimento</Label>
                  <Input id="data_nascimento" name="data_nascimento" type="date" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={createPaciente.isPending}>
                    {createPaciente.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-full md:max-w-md animate-slide-up">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, CPF ou telefone..."
            className="pl-12 h-12 rounded-xl w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPacientes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum paciente encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredPacientes.map((paciente, index) => {
              const pacienteConsultas = getConsultasByPaciente(paciente.id);
              
              return (
                <div 
                  key={paciente.id}
                  className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center text-2xl font-bold text-primary-foreground">
                      {paciente.nome.charAt(0)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 flex-wrap justify-end">
                        {paciente.tags?.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-primary"
                        onClick={() => { setEditingPaciente(paciente); setIsEditDialogOpen(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => deletePaciente.mutate(paciente.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground">{paciente.nome}</h3>
                  <p className="text-sm text-muted-foreground">CPF: {paciente.cpf}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{paciente.telefone}</span>
                    </div>
                    {paciente.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{paciente.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Cliente desde {new Date(paciente.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {paciente.observacoes && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2 font-semibold">Observações:</p>
                      <p className="text-sm text-foreground line-clamp-3">{paciente.observacoes}</p>
                    </div>
                  )}

                  {pacienteConsultas.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Consultas agendadas</p>
                      <div className="flex gap-2 flex-wrap">
                        {pacienteConsultas.map(consulta => (
                          <Badge key={consulta.id} className="bg-coral-light text-primary">
                            <Smile className="w-3 h-3 mr-1" /> {consulta.codigo_consulta}
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

        {/* Dialog de Edição de Paciente */}
        {editingPaciente && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Paciente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditPaciente} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_nome">Nome completo</Label>
                  <Input id="edit_nome" name="nome" required defaultValue={editingPaciente.nome} placeholder="Maria Silva" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_cpf">CPF</Label>
                    <Input id="edit_cpf" name="cpf" required defaultValue={editingPaciente.cpf} placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_telefone">WhatsApp</Label>
                    <Input id="edit_telefone" name="telefone" required defaultValue={editingPaciente.telefone} placeholder="11999999999" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_email">E-mail</Label>
                  <Input id="edit_email" name="email" type="email" defaultValue={editingPaciente.email || ''} placeholder="maria@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_data_nascimento">Data de nascimento</Label>
                  <Input id="edit_data_nascimento" name="data_nascimento" type="date" defaultValue={editingPaciente.data_nascimento || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_observacoes">Observações</Label>
                  <Textarea 
                    id="edit_observacoes" 
                    name="observacoes" 
                    defaultValue={editingPaciente.observacoes || ''} 
                    placeholder="Último atendimento, procedimentos realizados, alergias, etc." 
                    className="min-h-[100px]"
                  />
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={updatePaciente.isPending}>
                    {updatePaciente.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
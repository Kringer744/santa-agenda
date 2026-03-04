import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Phone, Trash2, Loader2, Smile, Edit, Clock, UserRound } from 'lucide-react'; 
import { usePacientes, useCreatePaciente, useDeletePaciente, useUpdatePaciente } from '@/hooks/usePacientes';
import { useConsultas } from '@/hooks/useConsultas';
import { Paciente } from '@/types';
import { format } from 'date-fns';

export default function Pacientes() {
  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [isMenor, setIsMenor] = useState(false);
  
  const { data: pacientes = [], isLoading } = usePacientes();
  const { data: consultas = [] } = useConsultas();
  const createPaciente = useCreatePaciente();
  const deletePaciente = useDeletePaciente();
  const updatePaciente = useUpdatePaciente();
  
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
      tags: isMenor ? ['menor-idade'] : ['adulto'],
      observacoes: null,
      meses_retorno: 6,
      is_menor_idade: isMenor,
      responsavel_nome: formData.get('responsavel_nome') as string || null,
      responsavel_telefone: formData.get('responsavel_telefone') as string || null,
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setIsMenor(false);
      }
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
      observacoes: formData.get('observacoes') as string || null,
      meses_retorno: parseInt(formData.get('meses_retorno') as string) || 6,
      is_menor_idade: isMenor,
      responsavel_nome: formData.get('responsavel_nome') as string || null,
      responsavel_telefone: formData.get('responsavel_telefone') as string || null,
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
              Gerencie seu cadastro de clientes e histórico de consultas
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) setIsMenor(false);
          }}>
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
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Paciente Menor de Idade?</Label>
                    <p className="text-xs text-muted-foreground">Ativa campos de responsável</p>
                  </div>
                  <Switch checked={isMenor} onCheckedChange={setIsMenor} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo do paciente</Label>
                  <Input id="nome" name="nome" required placeholder="Maria Silva" />
                </div>

                {isMenor && (
                  <div className="space-y-4 p-4 border border-primary/20 bg-primary/5 rounded-xl animate-fade-in">
                    <h4 className="text-xs font-bold uppercase text-primary flex items-center gap-2">
                      <UserRound size={14} /> Dados do Responsável
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="responsavel_nome">Nome do Responsável</Label>
                      <Input id="responsavel_nome" name="responsavel_nome" required={isMenor} placeholder="Nome do pai/mãe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="responsavel_telefone">WhatsApp do Responsável</Label>
                      <Input id="responsavel_telefone" name="responsavel_telefone" required={isMenor} placeholder="11999999999" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" name="cpf" required placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">WhatsApp do Paciente</Label>
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
                  className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up border border-border/50"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                      {paciente.nome.charAt(0)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        onClick={() => { 
                          setEditingPaciente(paciente); 
                          setIsMenor(paciente.is_menor_idade);
                          setIsEditDialogOpen(true); 
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deseja mesmo excluir o paciente {paciente.nome}? Esta ação removerá todos os dados permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePaciente.mutate(paciente.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Confirmar Exclusão
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">{paciente.nome}</h3>
                    {paciente.is_menor_idade && <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">MENOR</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">CPF: {paciente.cpf}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{paciente.telefone}</span>
                    </div>
                    {paciente.is_menor_idade && paciente.responsavel_nome && (
                      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        <UserRound className="w-4 h-4" />
                        <span className="text-xs">Resp: <strong>{paciente.responsavel_nome}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Retorno a cada {paciente.meses_retorno || 6} meses</span>
                    </div>
                  </div>

                  {paciente.observacoes && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">Observações / Último Procedimento:</p>
                      <p className="text-xs text-foreground line-clamp-3 bg-muted/30 p-2 rounded">{paciente.observacoes}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Histórico Recente</p>
                    <div className="flex gap-2 flex-wrap">
                      {pacienteConsultas.slice(0, 2).map(consulta => (
                        <Badge key={consulta.id} variant="secondary" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                          <Smile className="w-3 h-3 mr-1" /> {format(new Date(consulta.data_hora_inicio), 'dd/MM/yy')}
                        </Badge>
                      ))}
                      {pacienteConsultas.length === 0 && <span className="text-[10px] text-muted-foreground">Nenhum atendimento</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {editingPaciente && (
          <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingPaciente(null);
          }}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Perfil do Paciente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditPaciente} className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Paciente Menor de Idade?</Label>
                  </div>
                  <Switch checked={isMenor} onCheckedChange={setIsMenor} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_nome">Nome completo</Label>
                  <Input id="edit_nome" name="nome" required defaultValue={editingPaciente.nome} />
                </div>

                {isMenor && (
                  <div className="space-y-4 p-4 border border-primary/20 bg-primary/5 rounded-xl animate-fade-in">
                    <h4 className="text-xs font-bold uppercase text-primary flex items-center gap-2">
                      <UserRound size={14} /> Dados do Responsável
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="edit_responsavel_nome">Nome do Responsável</Label>
                      <Input id="edit_responsavel_nome" name="responsavel_nome" required={isMenor} defaultValue={editingPaciente.responsavel_nome || ''} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_responsavel_telefone">WhatsApp do Responsável</Label>
                      <Input id="edit_responsavel_telefone" name="responsavel_telefone" required={isMenor} defaultValue={editingPaciente.responsavel_telefone || ''} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_cpf">CPF</Label>
                    <Input id="edit_cpf" name="cpf" required defaultValue={editingPaciente.cpf} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_telefone">WhatsApp</Label>
                    <Input id="edit_telefone" name="telefone" required defaultValue={editingPaciente.telefone} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_data_nascimento">Data de nascimento</Label>
                    <Input id="edit_data_nascimento" name="data_nascimento" type="date" defaultValue={editingPaciente.data_nascimento || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meses_retorno">Periodicidade Retorno (Meses)</Label>
                    <Input id="meses_retorno" name="meses_retorno" type="number" defaultValue={editingPaciente.meses_retorno || 6} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_observacoes">Observações</Label>
                  <Textarea 
                    id="edit_observacoes" 
                    name="observacoes" 
                    defaultValue={editingPaciente.observacoes || ''} 
                    placeholder="Ex: Realizada limpeza em 10/10." 
                    className="min-h-[120px]"
                  />
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                    Fechar
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
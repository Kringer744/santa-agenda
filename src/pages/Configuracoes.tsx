import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, DollarSign, Pencil, Trash2, Loader2, Stethoscope } from 'lucide-react'; 
import { useClinicas, useCreateClinica, useDeleteClinica } from '@/hooks/useClinicas'; 
import { useProcedimentos, useCreateProcedimento } from '@/hooks/useProcedimentos'; 

export default function Configuracoes() {
  const [isClinicaDialogOpen, setIsClinicaDialogOpen] = useState(false);
  const [isProcedimentoDialogOpen, setIsProcedimentoDialogOpen] = useState(false);
  const { data: clinicas = [], isLoading: loadingClinicas } = useClinicas(); 
  const createClinica = useCreateClinica(); 
  const deleteClinica = useDeleteClinica(); 
  const { data: procedimentos = [], isLoading: loadingProcedimentos } = useProcedimentos(); 
  const createProcedimento = useCreateProcedimento(); 

  const handleAddClinica = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createClinica.mutate({
      nome: formData.get('nome') as string,
      endereco: formData.get('endereco') as string || null,
      cidade: formData.get('cidade') as string || null,
      estado: formData.get('estado') as string || null,
      capacidade_atendimentos: parseInt(formData.get('capacidade_atendimentos') as string) || 20, 
    }, {
      onSuccess: () => setIsClinicaDialogOpen(false)
    });
  };

  const handleAddProcedimento = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createProcedimento.mutate({
      nome: formData.get('nome') as string,
      preco: parseFloat(formData.get('preco') as string) || 0,
      icone: formData.get('icone') as string || '🦷', 
      ativo: true,
    }, {
      onSuccess: () => setIsProcedimentoDialogOpen(false)
    });
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Configure clínicas, procedimentos e outros detalhes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Clínicas */}
          <Card className="animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Building2 className="w-5 h-5 text-primary" />
                    Clínicas
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Gerencie as unidades da clínica
                  </CardDescription>
                </div>
                <Dialog open={isClinicaDialogOpen} onOpenChange={setIsClinicaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nova Clínica</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddClinica} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome da clínica</Label>
                        <Input id="nome" name="nome" required placeholder="Clínica OdontoCentro" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endereco">Endereço</Label>
                        <Input id="endereco" name="endereco" placeholder="Rua das Flores, 123" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cidade">Cidade</Label>
                          <Input id="cidade" name="cidade" placeholder="São Paulo" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado">Estado</Label>
                          <Input id="estado" name="estado" placeholder="SP" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="capacidade_atendimentos">Capacidade de Atendimentos Diários</Label>
                        <Input id="capacidade_atendimentos" name="capacidade_atendimentos" type="number" defaultValue="20" />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsClinicaDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={createClinica.isPending}>
                          {createClinica.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingClinicas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : clinicas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma clínica cadastrada</p>
              ) : (
                clinicas.map((clinica, index) => (
                  <div key={clinica.id} className="p-4 rounded-xl bg-muted/50 space-y-2" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-semibold text-foreground text-base">{clinica.nome}</h4>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteClinica.mutate(clinica.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {(clinica.endereco || clinica.cidade || clinica.estado) && (
                      <p className="text-sm text-muted-foreground">
                        {clinica.endereco} {clinica.endereco && (clinica.cidade || clinica.estado) ? ', ' : ''}
                        {clinica.cidade} {clinica.cidade && clinica.estado ? ' - ' : ''}
                        {clinica.estado}
                      </p>
                    )}
                    <div className="flex gap-3 flex-wrap">
                      <Badge className="bg-coral-light text-primary text-xs">
                        <Stethoscope className="w-3 h-3 mr-1" /> {clinica.capacidade_atendimentos} atendimentos
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Procedimentos */}
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <DollarSign className="w-5 h-5 text-secondary" />
                    Procedimentos
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Configure procedimentos e preços
                  </CardDescription>
                </div>
                <Dialog open={isProcedimentoDialogOpen} onOpenChange={setIsProcedimentoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Novo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Novo Procedimento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddProcedimento} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="procedimento_nome">Nome do procedimento</Label>
                        <Input id="procedimento_nome" name="nome" required placeholder="Limpeza Dental" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="preco">Preço (R$)</Label>
                          <Input id="preco" name="preco" type="number" step="0.01" required placeholder="150.00" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="icone">Ícone (emoji)</Label>
                          <Input id="icone" name="icone" placeholder="✨" />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsProcedimentoDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={createProcedimento.isPending}>
                          {createProcedimento.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingProcedimentos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : procedimentos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhum procedimento cadastrado</p>
              ) : (
                procedimentos.map((procedimento, index) => (
                  <div key={procedimento.id} className="flex items-center gap-4 p-4 rounded-xl bg-honey-light/50" style={{ animationDelay: `${index * 50}ms` }}>
                    <span className="text-2xl">{procedimento.icone}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-base">{procedimento.nome}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-base">
                        R$ {Number(procedimento.preco).toFixed(2)}
                      </span>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
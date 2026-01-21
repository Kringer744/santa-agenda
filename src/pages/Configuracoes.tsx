import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Building2, Trash2, CalendarCheck, Save, Loader2, Stethoscope, Plus } from 'lucide-react'; 
import { useClinicas, useDeleteClinica, useCreateClinica } from '@/hooks/useClinicas'; 
import { useProcedimentos, useCreateProcedimento } from '@/hooks/useProcedimentos'; 
import { useDentistas, useUpdateDentistaGoogleCalendarId } from '@/hooks/useDentistas';

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('clinica');
  const [isClinicaDialogOpen, setIsClinicaDialogOpen] = useState(false);
  const [isProcedimentoDialogOpen, setIsProcedimentoDialogOpen] = useState(false);
  
  const { data: clinicas = [] } = useClinicas(); 
  const createClinica = useCreateClinica();
  const deleteClinica = useDeleteClinica(); 
  
  const { data: procedimentos = [] } = useProcedimentos(); 
  const createProcedimento = useCreateProcedimento();

  const { data: dentistas = [] } = useDentistas();
  const updateDentistaGoogleCalendarId = useUpdateDentistaGoogleCalendarId();

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
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Configure as bases do sistema e integrações
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="clinica">Clínica</TabsTrigger>
            <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
            <TabsTrigger value="google-calendar">Google Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="clinica">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Dados da Clínica
                    </CardTitle>
                  </div>
                  <Dialog open={isClinicaDialogOpen} onOpenChange={setIsClinicaDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Adicionar Clínica</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Clínica</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddClinica} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome">Nome da Clínica</Label>
                          <Input id="nome" name="nome" required placeholder="Ex: Clínica Central" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cidade">Cidade</Label>
                            <Input id="cidade" name="cidade" placeholder="Ex: São Paulo" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="estado">Estado</Label>
                            <Input id="estado" name="estado" placeholder="Ex: SP" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endereco">Endereço</Label>
                          <Input id="endereco" name="endereco" placeholder="Ex: Av. Paulista, 1000" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="capacidade_atendimentos">Capacidade Diária</Label>
                          <Input id="capacidade_atendimentos" name="capacidade_atendimentos" type="number" defaultValue="20" />
                        </div>
                        <Button type="submit" className="w-full" disabled={createClinica.isPending}>
                          {createClinica.isPending ? <Loader2 className="animate-spin" /> : 'Salvar Clínica'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {clinicas.map((clinica) => (
                  <div key={clinica.id} className="p-4 rounded-xl border bg-muted/20 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{clinica.nome}</h4>
                      <p className="text-xs text-muted-foreground">{clinica.cidade} - {clinica.estado}</p>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive"><Trash2 size={16} /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Remover Clínica?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Não</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteClinica.mutate(clinica.id)}>Sim, Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
                {clinicas.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma clínica cadastrada.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="procedimentos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Serviços & Preços</CardTitle>
                <Dialog open={isProcedimentoDialogOpen} onOpenChange={setIsProcedimentoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Novo Procedimento</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Procedimento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddProcedimento} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="proc_nome">Nome do Procedimento</Label>
                        <Input id="proc_nome" name="nome" required placeholder="Ex: Limpeza Completa" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="preco">Preço (R$)</Label>
                          <Input id="preco" name="preco" type="number" step="0.01" required placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="icone">Ícone (Emoji)</Label>
                          <Input id="icone" name="icone" defaultValue="🦷" placeholder="🦷" />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={createProcedimento.isPending}>
                        {createProcedimento.isPending ? <Loader2 className="animate-spin" /> : 'Salvar Procedimento'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3">
                {procedimentos.map((proc) => (
                  <div key={proc.id} className="p-3 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{proc.icone}</span>
                      <span className="font-medium">{proc.nome}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">R$ {proc.preco.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                {procedimentos.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum procedimento cadastrado.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="google-calendar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                  Sincronização por Dentista
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted/30 rounded-xl border text-sm text-muted-foreground mb-4">
                  Insira o <strong>ID do Calendário</strong> (geralmente o e-mail do dentista) para que o sistema sincronize os agendamentos automaticamente.
                </div>
                
                <div className="space-y-4">
                  {dentistas.map((dentista) => (
                    <div key={dentista.id} className="p-4 border rounded-xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Stethoscope size={16} className="text-primary" />
                        </div>
                        <span className="font-bold">{dentista.nome}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input 
                          placeholder="ex: dentista@gmail.com" 
                          defaultValue={dentista.google_calendar_id || ''}
                          className="flex-1"
                          id={`calendar-id-${dentista.id}`}
                        />
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const input = document.getElementById(`calendar-id-${dentista.id}`) as HTMLInputElement;
                            updateDentistaGoogleCalendarId.mutate({
                              id: dentista.id,
                              google_calendar_id: input.value || null
                            });
                          }}
                          disabled={updateDentistaGoogleCalendarId.isPending}
                        >
                          {updateDentistaGoogleCalendarId.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="mr-2" />}
                          Vincular
                        </Button>
                      </div>
                    </div>
                  ))}
                  {dentistas.length === 0 && <p className="text-center py-8 text-muted-foreground">Cadastre dentistas primeiro.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
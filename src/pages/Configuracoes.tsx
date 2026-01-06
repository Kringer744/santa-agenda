import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // Importar Tabs
import { Building2, Plus, DollarSign, Trash2, Loader2, Stethoscope, CalendarDays, Save } from 'lucide-react'; 
import { useClinicas, useCreateClinica, useDeleteClinica } from '@/hooks/useClinicas'; 
import { useProcedimentos, useCreateProcedimento } from '@/hooks/useProcedimentos'; 
import { useDentistas, useUpdateDentista } from '@/hooks/useDentistas'; // Importar useDentistas e useUpdateDentista
import { Dentista } from '@/types'; // Importar o tipo Dentista

export default function Configuracoes() {
  const [isClinicaDialogOpen, setIsClinicaDialogOpen] = useState(false);
  const [isProcedimentoDialogOpen, setIsProcedimentoDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('clinica'); // Estado para a aba ativa
  const [dentistaCalendarIds, setDentistaCalendarIds] = useState<Record<string, string>>({}); // Estado para os IDs do Google Calendar

  const { data: clinicas = [], isLoading: loadingClinicas } = useClinicas(); 
  const createClinica = useCreateClinica(); 
  const deleteClinica = useDeleteClinica(); 
  
  const { data: procedimentos = [], isLoading: loadingProcedimentos } = useProcedimentos(); 
  const createProcedimento = useCreateProcedimento(); 

  const { data: dentistas = [], isLoading: loadingDentistas } = useDentistas(); // Carregar dentistas
  const updateDentista = useUpdateDentista(); // Hook para atualizar dentista

  useEffect(() => {
    if (dentistas.length > 0) {
      const initialIds: Record<string, string> = {};
      dentistas.forEach(d => {
        initialIds[d.id] = d.google_calendar_id || '';
      });
      setDentistaCalendarIds(initialIds);
    }
  }, [dentistas]);

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

  const handleSaveGoogleCalendarId = (dentistaId: string) => {
    const calendarId = dentistaCalendarIds[dentistaId];
    updateDentista.mutate({
      id: dentistaId,
      google_calendar_id: calendarId || null,
    });
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Configure os dados da sua clínica, procedimentos e integrações
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl grid w-full grid-cols-3 md:w-fit">
            <TabsTrigger value="clinica">Clínica</TabsTrigger>
            <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
            <TabsTrigger value="google-calendar">Google Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="clinica">
            <Card className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <Building2 className="w-5 h-5 text-primary" />
                      Dados da Clínica
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Informações básicas da unidade
                    </CardDescription>
                  </div>
                  
                  {clinicas.length === 0 && (
                    <Dialog open={isClinicaDialogOpen} onOpenChange={setIsClinicaDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Configurar Clínica
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Configurar Clínica</DialogTitle>
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
                          <div className="grid grid-cols-2 gap-4">
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
                          <Button type="submit" className="w-full" disabled={createClinica.isPending}>
                            {createClinica.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Dados'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingClinicas ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : clinicas.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm mb-4">Você ainda não configurou os dados da clínica.</p>
                  </div>
                ) : (
                  clinicas.map((clinica) => (
                    <div key={clinica.id} className="p-4 rounded-xl bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="font-semibold text-foreground text-base">{clinica.nome}</h4>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteClinica.mutate(clinica.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {(clinica.endereco || clinica.cidade || clinica.estado) && (
                        <p className="text-sm text-muted-foreground">
                          {clinica.endereco}, {clinica.cidade} - {clinica.estado}
                        </p>
                      )}
                      <Badge className="bg-coral-light text-primary text-xs">
                        <Stethoscope className="w-3 h-3 mr-1" /> {clinica.capacidade_atendimentos} atendimentos por dia
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="procedimentos">
            <Card className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <DollarSign className="w-5 h-5 text-secondary" />
                      Procedimentos
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Configure serviços e preços
                    </CardDescription>
                  </div>
                  <Dialog open={isProcedimentoDialogOpen} onOpenChange={setIsProcedimentoDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Novo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Novo Procedimento</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddProcedimento} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="procedimento_nome">Nome do procedimento</Label>
                          <Input id="procedimento_nome" name="nome" required placeholder="Limpeza Dental" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="preco">Preço (R$)</Label>
                            <Input id="preco" name="preco" type="number" step="0.01" required placeholder="150.00" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="icone">Ícone (emoji)</Label>
                            <Input id="icone" name="icone" placeholder="✨" />
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={createProcedimento.isPending}>
                          {createProcedimento.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Procedimento'}
                        </Button>
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
                ) : procedimentos.map((procedimento) => (
                  <div key={procedimento.id} className="flex items-center gap-4 p-4 rounded-xl bg-honey-light/50">
                    <span className="text-2xl">{procedimento.icone}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-base">{procedimento.nome}</p>
                    </div>
                    <span className="font-semibold text-foreground text-base">
                      R$ {Number(procedimento.preco).toFixed(2)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="google-calendar">
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Sincronização Google Calendar
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Configure o ID do Google Calendar para cada dentista.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingDentistas ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : dentistas.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm mb-4">Nenhum dentista cadastrado para configurar.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dentistas.map((dentista: Dentista) => (
                      <div key={dentista.id} className="p-4 rounded-xl bg-muted/50 space-y-2">
                        <h4 className="font-semibold text-foreground text-base">{dentista.nome}</h4>
                        <p className="text-sm text-muted-foreground">Especialidade: {dentista.especialidade || 'N/A'}</p>
                        <div className="flex items-end gap-2 mt-2">
                          <div className="flex-1 space-y-1">
                            <Label htmlFor={`calendar-id-${dentista.id}`} className="text-xs">ID do Google Calendar</Label>
                            <Input 
                              id={`calendar-id-${dentista.id}`}
                              placeholder="Ex: seu.dentista@gmail.com"
                              value={dentistaCalendarIds[dentista.id] || ''}
                              onChange={(e) => setDentistaCalendarIds(prev => ({ ...prev, [dentista.id]: e.target.value }))}
                            />
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveGoogleCalendarId(dentista.id)}
                            disabled={updateDentista.isPending}
                          >
                            {updateDentista.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
"use client";

import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageSquare, Play, Pause, Plus, Trash2, Save, Wifi, WifiOff, Loader2, Users, Send } from 'lucide-react';
import { toast } from 'sonner';
import { 
  testConnection, 
  createBulkCampaign, 
  sendTextMessage, 
  sendWhatsAppMenu, // Renomeado de sendInteractiveMenu
  getWhatsAppConfig, // Nova função
  updateWhatsAppConfig, // Nova função
} from '@/lib/uazap';
import { getPatientsWithBirthdayThisMonth } from '@/lib/whatsappClinicAutomation';
import { Paciente, WhatsAppMenuConfig, WhatsAppMenuOption } from '@/types'; // Importar os novos tipos
import { cn } from '@/lib/utils';

// Default menu para inicialização, se não houver nada no banco
const DEFAULT_MENU_CONFIG: WhatsAppMenuConfig = {
  api_url: '',
  instance_token: '',
  mensagem_boas_vindas: 'Olá! 🦷 Seja bem-vindo à nossa Clínica Odontológica. Como podemos cuidar do seu sorriso hoje?',
  menu_ativo: false,
  opcoes_menu: [
    { id: '1', texto: '🗓️ Agendar uma consulta', resposta: 'Ótimo! Para agendar sua consulta, acesse nosso link: https://dental-clinic.lovable.app/client-appointment', ativo: true },
    { id: '2', texto: '🦷 Conhecer procedimentos', resposta: 'Temos diversos procedimentos: Limpeza, Clareamento, Ortodontia e mais. Qual você gostaria de saber o preço?', ativo: true },
    { id: '3', texto: '📞 Falar com atendimento', resposta: 'Vou transferir você para um atendente. Aguarde um momento!', ativo: true },
  ],
  footer_text: 'DentalClinic - Atendimento Automático',
  list_button_text: 'Ver Opções',
};

// Definindo o tipo Lead
interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
}

export default function WhatsApp() {
  const [config, setConfig] = useState<WhatsAppMenuConfig>(DEFAULT_MENU_CONFIG);

  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTestMenu, setIsSendingTestMenu] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [manualNumbers, setManualNumbers] = useState('');
  const [mensagemDisparo, setMensagemDisparo] = useState('');
  const [disparoAtivo, setDisparoAtivo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [birthdayPatients, setBirthdayPatients] = useState<Paciente[]>([]);
  const [isSendingBirthdays, setIsSendingBirthdays] = useState(false);
  const [isLoadingBirthdays, setIsLoadingBirthdays] = useState(false);
  const [birthdayMessageEdit, setBirthdayMessageEdit] = useState('Parabéns {{nome}}! 🎂 A DentalClinic deseja a você um dia incrível e repleto de sorrisos.');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getWhatsAppConfig();
      if (data) {
        setConfig(data);
        if (data.api_url && data.instance_token) setConnectionStatus('connected');
      }
    } catch (error) { 
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configuração do WhatsApp.');
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const updatedConfig = await updateWhatsAppConfig(config);
      if (updatedConfig.id) {
        setConfig(prev => ({ ...prev, id: updatedConfig.id }));
      }
      toast.success('Configuração salva com sucesso!');
    } catch (error) { 
      console.error(error);
      toast.error('Erro ao salvar configuração'); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.api_url || !config.instance_token) {
      toast.error('URL e Token são necessários para testar.');
      return;
    }
    setIsTesting(true);
    setConnectionStatus('connecting');
    const result = await testConnection({ apiUrl: config.api_url, instanceToken: config.instance_token });
    if (result.success) {
      setConnectionStatus('connected');
      toast.success('Instância conectada com sucesso!');
      await handleSaveConfig();
    } else {
      setConnectionStatus('disconnected');
      toast.error(result.error || 'Falha na conexão com a instância');
    }
    setIsTesting(false);
  };

  const handleSendTestMenu = async () => {
    if (!config.api_url || !config.instance_token || !testPhoneNumber) {
      toast.error('URL da API, Token da Instância e Número de Telefone são necessários para enviar o menu de teste.');
      return;
    }
    if (!config.menu_ativo || config.opcoes_menu.filter(o => o.ativo).length === 0) {
      toast.error('O menu interativo precisa estar ativo e ter opções configuradas para ser enviado.');
      return;
    }

    setIsSendingTestMenu(true);
    try {
      const result = await sendWhatsAppMenu(
        { apiUrl: config.api_url, instanceToken: config.instance_token },
        testPhoneNumber,
        config.mensagem_boas_vindas,
        config.opcoes_menu,
        config.list_button_text || 'Ver Opções',
        config.footer_text || 'DentalClinic'
      );

      if (result.success) {
        toast.success('Menu de teste enviado com sucesso!');
      } else {
        toast.error(result.error || 'Falha ao enviar menu de teste.');
      }
    } catch (error: any) {
      console.error('Erro ao enviar menu de teste:', error);
      toast.error(`Erro ao enviar menu de teste: ${error.message}`);
    } finally {
      setIsSendingTestMenu(false);
    }
  };

  const handleAddMenuOption = () => {
    const newOption: WhatsAppMenuOption = {
      id: Math.random().toString(36).substr(2, 9),
      texto: '',
      resposta: '',
      ativo: true,
    };
    setConfig(prev => ({
      ...prev,
      opcoes_menu: [...prev.opcoes_menu, newOption]
    }));
  };

  const handleRemoveMenuOption = (id: string) => {
    setConfig(prev => ({
      ...prev,
      opcoes_menu: prev.opcoes_menu.filter(opt => opt.id !== id)
    }));
  };

  const handleUpdateMenuOption = (id: string, fields: Partial<WhatsAppMenuOption>) => {
    setConfig(prev => ({
      ...prev,
      opcoes_menu: prev.opcoes_menu.map(opt => opt.id === id ? { ...opt, ...fields } : opt)
    }));
  };

  const handleLoadBirthdays = async () => {
    setIsLoadingBirthdays(true);
    try {
      const patients = await getPatientsWithBirthdayThisMonth();
      setBirthdayPatients(patients);
      if (patients.length === 0) {
        toast.info('Nenhum aniversariante encontrado para este mês.');
      } else {
        toast.success(`${patients.length} aniversariantes encontrados para este mês!`);
      }
    } catch (error) {
      toast.error('Erro ao carregar aniversariantes.');
    } finally {
      setIsLoadingBirthdays(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const newLeads: Lead[] = lines.slice(1).map((line, index) => {
        const [nome, telefone, email] = line.split(',').map(s => s.trim());
        return { id: `lead-${index}`, nome: nome || 'Sem nome', telefone: telefone || '', email: email || '' };
      }).filter(lead => lead.telefone);
      setLeads(newLeads);
      toast.success(`${newLeads.length} contatos carregados do arquivo!`);
    };
    reader.readAsText(file);
  };

  const handleStartDisparo = async () => {
    const manualLeads: Lead[] = manualNumbers
      .split(/[\n,]/)
      .map(n => n.trim())
      .filter(n => n)
      .map((num, idx) => ({ id: `manual-${idx}`, nome: 'Cliente', telefone: num }));

    const allLeadsCombined = [...leads, ...manualLeads];

    if (!mensagemDisparo.trim() || allLeadsCombined.length === 0) {
      toast.error('Preencha a mensagem e adicione ao menos um número ou arquivo.');
      return;
    }
    
    setDisparoAtivo(true);
    const result = await createBulkCampaign(
      { apiUrl: config.api_url, instanceToken: config.instance_token }, 
      allLeadsCombined, 
      mensagemDisparo, 
      10, 
      30
    );
    
    if (result.success) {
      toast.success('Campanha iniciada com sucesso!');
    } else { 
      toast.error(result.error || 'Erro ao criar campanha'); 
    }
    setDisparoAtivo(false);
  };

  const handleSendBirthdayMessages = async () => {
    if (connectionStatus !== 'connected' || birthdayPatients.length === 0) {
      toast.error('Verifique a conexão e se há aniversariantes carregados.');
      return;
    }
    
    setIsSendingBirthdays(true);
    let successCount = 0;

    for (const patient of birthdayPatients) {
      const finalMsg = birthdayMessageEdit.replace(/\{\{nome\}\}/gi, patient.nome);
      const res = await sendTextMessage(
        { apiUrl: config.api_url, instanceToken: config.instance_token },
        patient.telefone,
        finalMsg
      );
      if (res.success) successCount++;
    }

    toast.success(`${successCount} mensagens de aniversário enviadas!`);
    setIsSendingBirthdays(false);
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-dental rounded-xl flex items-center justify-center text-white shadow-soft">
              <MessageSquare size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">WhatsApp Center</h1>
              <p className="text-muted-foreground text-sm">Automação e atendimento via WhatsApp</p>
            </div>
          </div>

          <div className={cn(
            "px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium",
            connectionStatus === 'connected' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          )}>
            {connectionStatus === 'connected' ? <Wifi size={16} /> : <WifiOff size={16} />}
            {connectionStatus === 'connected' ? 'Instância Online' : 'Desconectado'}
          </div>
        </div>

        <Tabs defaultValue="conexao" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="conexao" className="rounded-lg">Conexão</TabsTrigger>
            <TabsTrigger value="menu" className="rounded-lg">Menu Interativo</TabsTrigger>
            <TabsTrigger value="disparos" className="rounded-lg">Disparos & Campanhas</TabsTrigger>
          </TabsList>

          <TabsContent value="conexao">
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle>Configuração UAZAP</CardTitle>
                <CardDescription>Conecte sua instância da API UAZAP para enviar mensagens.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>URL da API</Label>
                    <Input placeholder="https://api.uazapi.com" value={config.api_url} onChange={e => setConfig(p => ({ ...p, api_url: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Token da Instância</Label>
                    <Input type="password" placeholder="Seu token secreto" value={config.instance_token} onChange={e => setConfig(p => ({ ...p, instance_token: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleTestConnection} disabled={isTesting} className="flex-1">
                    {isTesting ? <Loader2 className="animate-spin mr-2" /> : <Wifi className="mr-2" />}
                    {isTesting ? 'Testando...' : 'Conectar Instância'}
                  </Button>
                  <Button variant="outline" onClick={handleSaveConfig} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />}
                    Salvar
                  </Button>
                </div>

                <div className="pt-6 border-t space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Enviar Menu de Teste</h3>
                  <p className="text-sm text-muted-foreground">
                    Envie o menu interativo configurado para um número de sua escolha para testar.
                  </p>
                  <div className="flex gap-3">
                    <Input 
                      placeholder="Número de telefone (Ex: 5511999999999)" 
                      value={testPhoneNumber} 
                      onChange={e => setTestPhoneNumber(e.target.value)} 
                      className="flex-1"
                    />
                    <Button onClick={handleSendTestMenu} disabled={isSendingTestMenu || connectionStatus !== 'connected'}>
                      {isSendingTestMenu ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                      Enviar Teste
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="animate-fade-in">
            <div className="space-y-6">
              <Card className="shadow-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Resposta Automática</CardTitle>
                    <CardDescription>Configure o menu que seus clientes recebem ao iniciar um contato.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="menu-active">Ativar Menu</Label>
                    <Switch 
                      id="menu-active" 
                      checked={config.menu_ativo} 
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, menu_ativo: checked }))} 
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Mensagem de Boas-vindas (Título do Menu)</Label>
                    <Textarea 
                      className="min-h-[100px] bg-muted/30"
                      placeholder="Olá! Como podemos te ajudar?"
                      value={config.mensagem_boas_vindas}
                      onChange={e => setConfig(prev => ({ ...prev, mensagem_boas_vindas: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Texto do Botão da Lista</Label>
                      <Input 
                        placeholder="Ex: Ver Opções" 
                        value={config.list_button_text || ''} 
                        onChange={e => setConfig(p => ({ ...p, list_button_text: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto do Rodapé</Label>
                      <Input 
                        placeholder="Ex: DentalClinic" 
                        value={config.footer_text || ''} 
                        onChange={e => setConfig(p => ({ ...p, footer_text: e.target.value }))} 
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-bold">Opções do Menu</Label>
                      <Button size="sm" variant="outline" onClick={handleAddMenuOption}>
                        <Plus size={14} className="mr-1" /> Adicionar Opção
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {config.opcoes_menu.map((option, idx) => (
                        <div key={option.id} className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-all space-y-3 relative group">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveMenuOption(option.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            <div className="md:col-span-1 flex items-center justify-center h-10 w-10 bg-primary/10 rounded-lg font-bold text-primary">
                              {idx + 1}
                            </div>
                            <div className="md:col-span-11 space-y-3">
                              <div className="flex gap-4">
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs">Texto da Opção (botão)</Label>
                                  <Input 
                                    value={option.texto} 
                                    onChange={e => handleUpdateMenuOption(option.id, { texto: e.target.value })}
                                    placeholder="Ex: 🗓️ Agendar Consulta"
                                  />
                                </div>
                                <div className="flex items-end pb-2">
                                  <Switch 
                                    checked={option.ativo} 
                                    onCheckedChange={checked => handleUpdateMenuOption(option.id, { ativo: checked })}
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Resposta Automática</Label>
                                <Textarea 
                                  className="text-sm bg-muted/20"
                                  value={option.resposta}
                                  onChange={e => handleUpdateMenuOption(option.id, { resposta: e.target.value })}
                                  placeholder="Resposta automática"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSaveConfig} className="w-full bg-primary hover:bg-primary/90" disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                    Salvar Estrutura do Menu
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="disparos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Aniversariantes do Mês</CardTitle>
                  <CardDescription>Envie parabéns para os pacientes que fazem aniversário este mês.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" 
                    onClick={handleLoadBirthdays}
                    disabled={isLoadingBirthdays}
                  >
                    {isLoadingBirthdays ? <Loader2 className="animate-spin mr-2" /> : <Users className="mr-2" size={16} />}
                    CARREGAR ANIVERSARIANTES DO MÊS
                  </Button>
                  
                  {birthdayPatients.length > 0 && (
                    <div className="p-3 bg-muted rounded-lg text-xs font-medium">
                      {birthdayPatients.length} pacientes encontrados para este mês.
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Mensagem Programada</Label>
                    <Textarea 
                      placeholder="Edite a mensagem aqui..."
                      value={birthdayMessageEdit}
                      onChange={e => setBirthdayMessageEdit(e.target.value)}
                      className="min-h-[100px] bg-muted/20"
                    />
                    <p className="text-[10px] text-muted-foreground">Use {'{{nome}}'} para inserir o nome do paciente.</p>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleSendBirthdayMessages} 
                    disabled={isSendingBirthdays || birthdayPatients.length === 0}
                  >
                    {isSendingBirthdays ? <Loader2 className="animate-spin mr-2" /> : <MessageSquare size={16} className="mr-2" />}
                    {isSendingBirthdays ? 'Enviando...' : 'Disparar Parabéns'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Campanha em Massa</CardTitle>
                  <CardDescription>Envie mensagens personalizadas para uma lista de contatos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Números Manuais</Label>
                    <Textarea 
                      placeholder="Cole os números aqui (Ex: 11999999999, 11888888888)"
                      value={manualNumbers}
                      onChange={e => setManualNumbers(e.target.value)}
                      className="min-h-[80px] bg-muted/20"
                    />
                  </div>

                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    {leads.length > 0 ? `${leads.length} contatos do arquivo` : 'Ou carregar Arquivo CSV'}
                  </Button>

                  <div className="space-y-1 pt-2">
                    <Label className="text-xs">Corpo da Mensagem (use {'{{nome}}'} para personalizar)</Label>
                    <Textarea 
                      placeholder="Mensagem..." 
                      value={mensagemDisparo} 
                      onChange={e => setMensagemDisparo(e.target.value)} 
                      className="min-h-[120px] bg-muted/30"
                    />
                  </div>
                  <Button className="w-full" onClick={handleStartDisparo} disabled={disparoAtivo || (leads.length === 0 && !manualNumbers.trim())}>
                    {disparoAtivo ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    Iniciar Campanha
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
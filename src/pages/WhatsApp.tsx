import { useState, useRef, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, CheckCircle, Clock, Zap, Smartphone, Upload, Users, Play, Pause, Trash2, FileSpreadsheet, Bot, List, Save, CalendarDays, Camera, Star, Gift, BellRing, Loader2, Plus, Smile, Stethoscope, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { testConnection, sendInteractiveMenu, createBulkCampaign } from '@/lib/uazap';

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
}

interface MenuOption {
  id: string;
  texto: string;
  resposta: string;
  ativo: boolean;
}

interface WhatsAppConfig {
  id?: string;
  api_url: string;
  instance_token: string;
  menu_ativo: boolean;
  mensagem_boas_vindas: string;
  opcoes_menu: MenuOption[];
}

interface WhatsAppTemplate {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  mensagem: string;
  ativo: boolean | null;
  created_at: string;
  updated_at: string;
}

export default function WhatsApp() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    api_url: '',
    instance_token: '',
    menu_ativo: false,
    mensagem_boas_vindas: 'Olá! 🦷 Seja bem-vindo à nossa Clínica Odontológica. Como podemos cuidar do seu sorriso hoje?',
    opcoes_menu: [
      {
        id: '1',
        texto: '🗓️ Agendar uma consulta',
        resposta: 'Ótimo! Vamos iniciar seu agendamento. Qual a data e horário preferidos?',
        ativo: true
      },
      {
        id: '2',
        texto: '🦷 Conhecer procedimentos',
        resposta: 'Temos diversos procedimentos para cuidar da sua saúde bucal. Qual você gostaria de saber mais?',
        ativo: true
      },
      {
        id: '3',
        texto: '📞 Falar com atendimento',
        resposta: 'Vou transferir você para um atendente. Aguarde um momento!',
        ativo: true
      },
    ],
  });

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [numerosManuais, setNumerosManuais] = useState('');
  const manualLeads = useMemo(() => {
    const lines = numerosManuais
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
      
    return lines
      .map((line, idx) => {
        const parts = line.split(',').map((p) => p.trim()).filter(Boolean);
        const telefone = parts.length >= 2 ? parts[1] : parts[0] || '';
        const nome = parts.length >= 2 ? (parts[0] || 'Contato') : 'Contato';
        
        return {
          id: `manual-${idx}`,
          nome,
          telefone,
          email: '',
        } as Lead;
      })
      .filter((l) => l.telefone);
  }, [numerosManuais]);
  
  const allLeads = useMemo(() => [...leads, ...manualLeads], [leads, manualLeads]);
  const [mensagemDisparo, setMensagemDisparo] = useState('');
  const [delayMin, setDelayMin] = useState(10);
  const [delayMax, setDelayMax] = useState(30);
  const [disparoAtivo, setDisparoAtivo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuTestNumber, setMenuTestNumber] = useState('');
  const [selectedTemplateForBulk, setSelectedTemplateForBulk] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadConfig();
    loadTemplates();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .limit(1)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data) {
        const opcoesMenu = Array.isArray(data.opcoes_menu) ? (data.opcoes_menu as unknown as MenuOption[]) : [];
        
        setConfig({
          id: data.id,
          api_url: data.api_url,
          instance_token: data.instance_token,
          menu_ativo: data.menu_ativo || false,
          mensagem_boas_vindas: data.mensagem_boas_vindas || '',
          opcoes_menu: opcoesMenu,
        });
        
        if (data.api_url && data.instance_token) {
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('tipo');
        
      if (error) {
        console.error('Supabase error loading templates:', error);
        // Throw the error to be caught by the outer catch block
        throw new Error(error.message); 
      }
      
      if (data) {
        setTemplates(data as WhatsAppTemplate[]);
      } else {
        console.log('Nenhum dado retornado para whatsapp_templates, definindo array vazio.');
        setTemplates([]);
      }
    } catch (error: any) {
      console.error('Erro geral ao carregar templates:', error);
      setTemplates([]); // Ensure templates are empty on error

      // Check for the specific schema cache error message
      if (error.message && error.message.includes("Could not find the table 'public.whatsapp_templates' in the schema cache")) {
        toast.error('Erro: Tabela de templates não encontrada no Supabase. Por favor, siga as instruções para criar a tabela e recarregar o schema cache.');
      } else {
        toast.error(`Erro ao carregar templates: ${error.message || 'Detalhes desconhecidos'}`);
      }
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config.api_url || !config.instance_token) {
      toast.error('Preencha a URL da API e o Token');
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (config.id) {
        const { error } = await supabase
          .from('whatsapp_config')
          .update({
            api_url: config.api_url,
            instance_token: config.instance_token,
            menu_ativo: config.menu_ativo,
            mensagem_boas_vindas: config.mensagem_boas_vindas,
            opcoes_menu: JSON.parse(JSON.stringify(config.opcoes_menu)),
          })
          .eq('id', config.id);
          
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('whatsapp_config')
          .insert([{
            api_url: config.api_url,
            instance_token: config.instance_token,
            menu_ativo: config.menu_ativo,
            mensagem_boas_vindas: config.mensagem_boas_vindas,
            opcoes_menu: JSON.parse(JSON.stringify(config.opcoes_menu)),
          }])
          .select()
          .single();
          
        if (error) throw error;
        
        setConfig(prev => ({ ...prev, id: data.id }));
      }
      
      toast.success('Configuração salva!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllTemplates = async () => {
    setIsSaving(true);
    try {
      for (const template of templates) {
        if (template.id) {
          const { error } = await supabase
            .from('whatsapp_templates')
            .update({
              nome: template.nome,
              descricao: template.descricao,
              tipo: template.tipo,
              mensagem: template.mensagem,
              ativo: template.ativo,
              updated_at: new Date().toISOString()
            })
            .eq('id', template.id);
            
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('whatsapp_templates')
            .insert({
              nome: template.nome,
              descricao: template.descricao,
              tipo: template.tipo,
              mensagem: template.mensagem,
              ativo: template.ativo,
            });
          if (error) throw error;
        }
      }
      toast.success('Templates salvos com sucesso!');
      loadTemplates();
    } catch (error) {
      console.error('Erro ao salvar templates:', error);
      toast.error('Erro ao salvar templates');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTemplate = (id: string, field: keyof WhatsAppTemplate, value: string | boolean | null) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleAddTemplate = async (type: string, defaultName: string, defaultDescription: string, defaultMessage: string) => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .insert({
          nome: defaultName,
          descricao: defaultDescription,
          tipo: type,
          mensagem: defaultMessage,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success(`Template '${defaultName}' adicionado!`);
      loadTemplates();
    } catch (error: any) {
      console.error('Erro ao adicionar template:', error);
      toast.error(`Erro ao adicionar template: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.api_url || !config.instance_token) {
      toast.error('Preencha a URL da API e o Token da Instância');
      return;
    }
    
    setIsTesting(true);
    setConnectionStatus('connecting');
    
    const result = await testConnection({
      apiUrl: config.api_url,
      instanceToken: config.instance_token,
    });
    
    if (result.success) {
      setConnectionStatus('connected');
      toast.success('Conexão testada com sucesso! API configurada.');
      await handleSaveConfig();
    } else {
      setConnectionStatus('disconnected');
      toast.error(result.error || 'Falha na conexão com a API');
    }
    
    setIsTesting(false);
  };

  const handleDisconnect = () => {
    setConnectionStatus('disconnected');
    toast.info('Desconectado');
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
        return {
          id: `lead-${index}`,
          nome: nome || 'Sem nome',
          telefone: telefone || '',
          email: email || ''
        };
      }).filter(lead => lead.telefone);
      
      try {
        const { error } = await supabase
          .from('whatsapp_leads')
          .insert(newLeads.map(l => ({
            nome: l.nome,
            telefone: l.telefone,
            email: l.email,
          })));
          
        if (error) throw error;
        
        setLeads(newLeads);
        toast.success(`${newLeads.length} leads importados com sucesso!`);
      } catch (error) {
        console.error('Erro ao salvar leads:', error);
        setLeads(newLeads);
        toast.success(`${newLeads.length} leads carregados!`);
      }
    };
    
    reader.readAsText(file);
  };

  const handleStartDisparo = async () => {
    if (!mensagemDisparo.trim()) {
      toast.error('Digite a mensagem do disparo');
      return;
    }
    
    if (allLeads.length === 0) {
      toast.error('Importe uma base de leads ou adicione números manualmente');
      return;
    }
    
    if (connectionStatus !== 'connected') {
      toast.error('Configure a conexão primeiro');
      return;
    }
    
    setDisparoAtivo(true);
    toast.loading('Criando campanha de disparo...');
    
    const result = await createBulkCampaign(
      {
        apiUrl: config.api_url,
        instanceToken: config.instance_token,
      },
      allLeads,
      mensagemDisparo,
      delayMin,
      delayMax
    );
    
    if (result.success) {
      toast.success('Campanha criada e iniciada!');
      
      await supabase.from('whatsapp_campaigns').insert({
        nome: `Campanha ${new Date().toLocaleDateString('pt-BR')}`,
        mensagem: mensagemDisparo,
        delay_min: delayMin,
        delay_max: delayMax,
        status: 'sending',
        total_leads: allLeads.length,
      });
    } else {
      toast.error(result.error || 'Erro ao criar campanha');
    }
    
    setDisparoAtivo(false);
  };

  const handleStopDisparo = () => {
    setDisparoAtivo(false);
    toast.info('Disparo pausado');
  };

  const handleClearLeads = async () => {
    setLeads([]);
    await supabase.from('whatsapp_leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    toast.info('Base de leads limpa');
  };

  const handleToggleMenuOption = (id: string) => {
    setConfig(prev => ({
      ...prev,
      opcoes_menu: prev.opcoes_menu.map(opt => 
        opt.id === id ? { ...opt, ativo: !opt.ativo } : opt
      )
    }));
  };

  const handleUpdateMenuOption = (id: string, field: 'texto' | 'resposta', value: string) => {
    setConfig(prev => ({
      ...prev,
      opcoes_menu: prev.opcoes_menu.map(opt => 
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const handleAddMenuOption = () => {
    const newId = String(config.opcoes_menu.length + 1);
    setConfig(prev => ({
      ...prev,
      opcoes_menu: [...prev.opcoes_menu, {
        id: newId,
        texto: 'Nova opção',
        resposta: 'Resposta automática...',
        ativo: true
      }]
    }));
  };

  const handleSaveMenu = async () => {
    setIsSaving(true);
    await handleSaveConfig();
    toast.success('Menu salvo com sucesso!');
    setIsSaving(false);
  };

  const handleTestMenu = async () => {
    const testNumber = menuTestNumber.trim();
    if (!testNumber) {
      toast.error('Informe um número para testar o menu');
      return;
    }
    
    if (connectionStatus !== 'connected') {
      toast.error('Conecte a API primeiro');
      return;
    }
    
    toast.loading('Enviando menu de teste...');
    
    const result = await sendInteractiveMenu(
      {
        apiUrl: config.api_url,
        instanceToken: config.instance_token,
      },
      testNumber,
      config.mensagem_boas_vindas,
      config.opcoes_menu
    );
    
    if (result.success) {
      toast.success('Menu enviado com sucesso!');
    } else {
      toast.error(result.error || 'Erro ao enviar menu');
    }
  };

  const handleSelectTemplateForBulk = (templateId: string) => {
    setSelectedTemplateForBulk(templateId);
    const selected = templates.find(t => t.id === templateId);
    if (selected) {
      setMensagemDisparo(selected.mensagem);
    } else {
      setMensagemDisparo('');
    }
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-mint flex items-center justify-center">
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">WhatsApp</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Integração com UAZAP para automações da clínica
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="conexao" className="animate-slide-up">
          <TabsList className="bg-muted flex-wrap h-auto gap-1 p-1 w-full justify-start md:justify-center">
            <TabsTrigger value="conexao" className="gap-2 text-xs md:text-sm">
              <Zap className="w-4 h-4" />
              Conexão
            </TabsTrigger>
            <TabsTrigger value="menu" className="gap-2 text-xs md:text-sm">
              <Bot className="w-4 h-4" />
              Menu Conversa
            </TabsTrigger>
            <TabsTrigger value="disparos" className="gap-2 text-xs md:text-sm">
              <Send className="w-4 h-4" />
              Disparos
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2 text-xs md:text-sm">
              <Clock className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conexao" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Zap className="w-5 h-5 text-primary" />
                    Configurar API UAZAP
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Insira a URL da API e o Token da sua instância UAZAP
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-url">URL da API *</Label>
                    <Input
                      id="api-url"
                      placeholder="https://sua-instancia.uazapi.com"
                      value={config.api_url}
                      onChange={(e) => setConfig(prev => ({ ...prev, api_url: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: https://api.uazapi.com ou sua URL personalizada
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instance-token">Token da Instância *</Label>
                    <Input
                      id="instance-token"
                      type="password"
                      placeholder="Token gerado na sua instância UAZAP"
                      value={config.instance_token}
                      onChange={(e) => setConfig(prev => ({ ...prev, instance_token: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      O token é gerado quando você cria a instância no painel UAZAP
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1"
                      onClick={handleTestConnection}
                      disabled={!config.api_url || !config.instance_token || isTesting}
                    >
                      {isTesting ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Testar Conexão
                        </>
                      )}
                    </Button>
                    
                    {connectionStatus === 'connected' && (
                      <Button
                        variant="outline"
                        onClick={handleDisconnect}
                        className="flex-1 sm:flex-none"
                      >
                        Desconectar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Status da Conexão</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Verifique se a API está configurada corretamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "p-4 md:p-6 rounded-xl text-center",
                    connectionStatus === 'connected' ? "bg-mint-light" : "bg-muted"
                  )}>
                    <div className={cn(
                      "w-14 h-14 md:w-16 md:h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                      connectionStatus === 'connected' 
                        ? "bg-secondary" 
                        : connectionStatus === 'connecting' 
                          ? "bg-honey" 
                          : "bg-muted-foreground/20"
                    )}>
                      {connectionStatus === 'connecting' ? (
                        <Clock className="w-7 h-7 md:w-8 md:h-8 text-accent-foreground animate-spin" />
                      ) : (
                        <Smartphone className={cn(
                          "w-7 h-7 md:w-8 md:h-8",
                          connectionStatus === 'connected' 
                            ? "text-secondary-foreground" 
                            : "text-muted-foreground"
                        )} />
                      )}
                    </div>
                    
                    <p className={cn(
                      "font-semibold text-base md:text-lg",
                      connectionStatus === 'connected' 
                        ? "text-secondary" 
                        : connectionStatus === 'connecting' 
                          ? "text-accent-foreground" 
                          : "text-muted-foreground"
                    )}>
                      {connectionStatus === 'connected' 
                        ? 'API Conectada' 
                        : connectionStatus === 'connecting' 
                          ? 'Testando conexão...' 
                          : 'Não Configurado'}
                    </p>
                    
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      {connectionStatus === 'connected' 
                        ? 'Pronto para enviar mensagens e usar automações' 
                        : 'Configure a URL e Token para conectar'}
                    </p>
                    
                    {connectionStatus === 'connected' && (
                      <div className="mt-4 p-3 rounded-lg bg-background/50 text-left space-y-2">
                        <p className="text-xs font-medium text-foreground mb-1">Configuração ativa:</p>
                        <p className="text-xs text-muted-foreground truncate">{config.api_url}</p>
                        
                        <div className="border-t border-border/50 pt-2 mt-2">
                          <p className="text-xs font-medium text-foreground mb-1">URL do Webhook (configure no painel UAZAP):</p>
                          <code className="text-xs text-primary break-all select-all">
                            https://wnbzfvxnskvdvosjuklt.supabase.co/functions/v1/uazap-webhook
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="menu" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                        <Bot className="w-5 h-5 text-primary" />
                        Menu Interativo
                      </CardTitle>
                      <CardDescription className="text-sm md:text-base">
                        Configure o menu automático que aparece quando o paciente envia mensagem
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor="menu-ativo" className="text-sm">Menu Ativo</Label>
                      <Switch
                        id="menu-ativo"
                        checked={config.menu_ativo}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, menu_ativo: checked }))}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm">Mensagem de Boas-vindas</Label>
                    <Textarea
                      value={config.mensagem_boas_vindas}
                      onChange={(e) => setConfig(prev => ({ ...prev, mensagem_boas_vindas: e.target.value }))}
                      className="min-h-20"
                      placeholder="Olá! Seja bem-vindo..."
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Label className="text-sm">Opções do Menu</Label>
                      <Button variant="outline" size="sm" onClick={handleAddMenuOption}>
                        <List className="w-4 h-4 mr-2" />
                        Adicionar opção
                      </Button>
                    </div>
                    
                    {config.opcoes_menu.map((opcao, index) => (
                      <div 
                        key={opcao.id} 
                        className="p-4 rounded-xl border bg-card space-y-3 animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">Opção {opcao.id}</Badge>
                          <Switch
                            checked={opcao.ativo}
                            onCheckedChange={() => handleToggleMenuOption(opcao.id)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Texto do botão</Label>
                          <Input
                            value={opcao.texto}
                            onChange={(e) => handleUpdateMenuOption(opcao.id, 'texto', e.target.value)}
                            placeholder="Texto que aparece no botão..."
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Resposta automática</Label>
                          <Textarea
                            value={opcao.resposta}
                            onChange={(e) => handleUpdateMenuOption(opcao.id, 'resposta', e.target.value)}
                            className="min-h-16"
                            placeholder="Resposta quando clicar nessa opção..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="menu-test-number" className="text-sm">Número para enviar o menu</Label>
                    <Input
                      id="menu-test-number"
                      placeholder="Ex: 5511999999999"
                      value={menuTestNumber}
                      onChange={(e) => setMenuTestNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Dica: use DDI + DDD (ex: 55 + 11 + número)
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1"
                      onClick={handleSaveMenu}
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Salvando...' : 'Salvar Menu'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleTestMenu}
                      disabled={connectionStatus !== 'connected'}
                      className="flex-1 sm:flex-none"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Menu
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Preview do Menu</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Assim ficará a mensagem no WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10 p-4 rounded-xl max-w-sm mx-auto">
                    <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm">
                      <p className="text-sm text-foreground">{config.mensagem_boas_vindas}</p>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      {config.opcoes_menu.filter(o => o.ativo).map((opcao) => (
                        <div
                          key={opcao.id}
                          className="bg-white dark:bg-card p-2 rounded-lg shadow-sm text-center text-sm font-medium text-primary cursor-pointer hover:bg-primary/5 transition-colors"
                        >
                          {opcao.texto}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="disparos" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Upload className="w-5 h-5 text-primary" />
                    Importar Base de Leads
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Faça upload de um arquivo CSV com: nome,telefone,email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground">
                      Clique para fazer upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formato: CSV (nome,telefone,email)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <Label htmlFor="manual-numbers" className="text-sm">Ou adicione números manualmente</Label>
                      {manualLeads.length > 0 && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Users className="w-3 h-3" />
                          {manualLeads.length} números
                        </Badge>
                      )}
                    </div>
                    
                    <Textarea
                      id="manual-numbers"
                      value={numerosManuais}
                      onChange={(e) => setNumerosManuais(e.target.value)}
                      className="min-h-24"
                      placeholder="Cole um por linha:
5511999999999
5511988887777

Ou: Nome,5511999999999"
                    />
                    
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs text-muted-foreground">
                        Um número por linha (com DDI). Opcional: "Nome,telefone".
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setNumerosManuais('')}
                        disabled={!numerosManuais.trim()}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Limpar
                      </Button>
                    </div>
                  </div>
                  
                  {leads.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Users className="w-3 h-3" />
                          {leads.length} leads
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearLeads}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Limpar
                        </Button>
                      </div>
                      
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {leads.slice(0, 5).map((lead) => (
                          <div
                            key={lead.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 text-sm"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{lead.nome}</p>
                              <p className="text-xs text-muted-foreground">{lead.telefone}</p>
                            </div>
                          </div>
                        ))}
                        
                        {leads.length > 5 && (
                          <p className="text-xs text-center text-muted-foreground">
                            + {leads.length - 5} leads...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {(allLeads.length > 0) && (
                    <p className="text-xs text-muted-foreground text-center">
                      Total para disparo: <span className="font-medium text-foreground">{allLeads.length}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Send className="w-5 h-5 text-primary" />
                    Configurar Disparo
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Defina a mensagem e delays entre envios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Selecionar Template (Opcional)</Label>
                    {isLoadingTemplates ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" /> Carregando templates...
                      </div>
                    ) : templates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-4 rounded-md bg-muted text-muted-foreground text-sm text-center space-y-2">
                        <Database className="w-6 h-6" />
                        <p>Nenhum template encontrado.</p>
                        <p className="text-xs">Verifique se a tabela `whatsapp_templates` existe no Supabase e se o schema cache foi recarregado.</p>
                      </div>
                    ) : (
                      <Select value={selectedTemplateForBulk} onValueChange={handleSelectTemplateForBulk}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um template para preencher a mensagem" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Mensagem Personalizada</SelectItem>
                          {templates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.nome} ({template.tipo === 'promocao' ? 'Promoção' : 'Outro'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Mensagem do Disparo</Label>
                    <Textarea
                      value={mensagemDisparo}
                      onChange={(e) => setMensagemDisparo(e.target.value)}
                      className="min-h-32"
                      placeholder="Olá {{nome}}! Temos uma novidade especial para você..."
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                        {'{{nome}}'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                        {'{{telefone}}'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                        {'{{email}}'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Delay Mínimo (seg)</Label>
                      <Input
                        type="number"
                        value={delayMin}
                        onChange={(e) => setDelayMin(Number(e.target.value))}
                        min={5}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Delay Máximo (seg)</Label>
                      <Input
                        type="number"
                        value={delayMax}
                        onChange={(e) => setDelayMax(Number(e.target.value))}
                        min={delayMin}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {disparoAtivo ? (
                      <Button
                        className="flex-1"
                        variant="destructive"
                        onClick={handleStopDisparo}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pausar Disparo
                      </Button>
                    ) : (
                      <Button
                        className="flex-1"
                        onClick={handleStartDisparo}
                        disabled={connectionStatus !== 'connected' || allLeads.length === 0}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Iniciar Disparo
                      </Button>
                    )}
                  </div>
                  
                  {connectionStatus !== 'connected' && (
                    <p className="text-xs text-center text-muted-foreground">
                      Conecte a API primeiro para fazer disparos
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="historico" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Campanhas e Mensagens</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Histórico de todas as campanhas e mensagens enviadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm md:text-base">Nenhuma campanha enviada ainda</p>
                  <p className="text-xs md:text-sm">Configure a conexão e inicie uma campanha</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
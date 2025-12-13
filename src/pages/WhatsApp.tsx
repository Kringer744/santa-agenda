import { useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  MessageSquare, 
  Settings, 
  Send, 
  Calendar, 
  CheckCircle, 
  Clock,
  Zap,
  Smartphone,
  QrCode,
  Upload,
  Users,
  Play,
  Pause,
  Trash2,
  FileSpreadsheet,
  Bot,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const mensagensTemplate = [
  {
    id: 'pre-estadia',
    titulo: 'Pré-estadia (1 dia antes)',
    icone: '📅',
    mensagem: 'Oi! 🐾 Amanhã esperamos o {{nome_pet}}. Qualquer dúvida estamos por aqui.',
    ativo: true,
  },
  {
    id: 'durante',
    titulo: 'Durante a hospedagem',
    icone: '📸',
    mensagem: 'Olá! Segue uma foto do {{nome_pet}} curtindo o dia no hotel! 💙',
    ativo: true,
  },
  {
    id: 'pos-estadia',
    titulo: 'Pós-estadia',
    icone: '⭐',
    mensagem: 'Foi um prazer cuidar do {{nome_pet}}! 💙 Avalie sua experiência.',
    ativo: true,
  },
  {
    id: 'aniversario',
    titulo: 'Aniversário do Pet',
    icone: '🎉',
    mensagem: '🎉 Hoje é aniversário do {{nome_pet}}! Temos um presente especial pra ele 🐶🐱',
    ativo: false,
  },
];

const mensagensEnviadas = [
  { id: 1, tipo: 'pre-estadia', pet: 'Rex', tutor: 'Maria Silva', data: '2024-12-11', status: 'enviada' },
  { id: 2, tipo: 'durante', pet: 'Rex', tutor: 'Maria Silva', data: '2024-12-12', status: 'enviada' },
  { id: 3, tipo: 'pre-estadia', pet: 'Thor', tutor: 'João Santos', data: '2024-12-12', status: 'agendada' },
];

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

export default function WhatsApp() {
  const [apiUrl, setApiUrl] = useState('');
  const [instanceToken, setInstanceToken] = useState('');
  const [templates, setTemplates] = useState(mensagensTemplate);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isTesting, setIsTesting] = useState(false);
  
  // Menu de conversa
  const [menuAtivo, setMenuAtivo] = useState(false);
  const [mensagemBoasVindas, setMensagemBoasVindas] = useState(
    'Olá! 🐾 Seja bem-vindo ao nosso Hotel para Pets. Como podemos cuidar do seu pet hoje?'
  );
  const [opcoesMenu, setOpcoesMenu] = useState<MenuOption[]>([
    { id: '1', texto: '🐶 Reservar hospedagem para meu pet', resposta: 'Ótimo! Vamos iniciar sua reserva. Qual a data de check-in?', ativo: true },
    { id: '2', texto: '📅 Consultar disponibilidade', resposta: 'Vou verificar nossa disponibilidade. Para qual período você precisa?', ativo: true },
    { id: '3', texto: '📞 Falar com atendimento', resposta: 'Vou transferir você para um atendente. Aguarde um momento!', ativo: true },
  ]);

  // Upload de leads
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mensagemDisparo, setMensagemDisparo] = useState('');
  const [delayMin, setDelayMin] = useState(10);
  const [delayMax, setDelayMax] = useState(30);
  const [disparoAtivo, setDisparoAtivo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleTemplate = (id: string) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, ativo: !t.ativo } : t
    ));
  };

  const handleTestConnection = async () => {
    if (!apiUrl || !instanceToken) {
      toast.error('Preencha a URL da API e o Token da Instância');
      return;
    }

    setIsTesting(true);
    setConnectionStatus('connecting');
    
    // Simula teste de conexão - em produção faria GET /instance/info
    setTimeout(() => {
      setConnectionStatus('connected');
      setIsTesting(false);
      toast.success('Conexão testada com sucesso! API configurada.');
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnectionStatus('disconnected');
    toast.info('Desconectado');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Assume CSV: nome,telefone,email
      const newLeads: Lead[] = lines.slice(1).map((line, index) => {
        const [nome, telefone, email] = line.split(',').map(s => s.trim());
        return {
          id: `lead-${index}`,
          nome: nome || 'Sem nome',
          telefone: telefone || '',
          email: email || ''
        };
      }).filter(lead => lead.telefone);

      setLeads(newLeads);
      toast.success(`${newLeads.length} leads importados com sucesso!`);
    };
    reader.readAsText(file);
  };

  const handleStartDisparo = () => {
    if (!mensagemDisparo.trim()) {
      toast.error('Digite a mensagem do disparo');
      return;
    }
    if (leads.length === 0) {
      toast.error('Importe uma base de leads primeiro');
      return;
    }
    setDisparoAtivo(true);
    toast.success('Disparo iniciado!');
  };

  const handleStopDisparo = () => {
    setDisparoAtivo(false);
    toast.info('Disparo pausado');
  };

  const handleClearLeads = () => {
    setLeads([]);
    toast.info('Base de leads limpa');
  };

  const handleToggleMenuOption = (id: string) => {
    setOpcoesMenu(opcoesMenu.map(opt =>
      opt.id === id ? { ...opt, ativo: !opt.ativo } : opt
    ));
  };

  const handleUpdateMenuOption = (id: string, field: 'texto' | 'resposta', value: string) => {
    setOpcoesMenu(opcoesMenu.map(opt =>
      opt.id === id ? { ...opt, [field]: value } : opt
    ));
  };

  const handleAddMenuOption = () => {
    const newId = String(opcoesMenu.length + 1);
    setOpcoesMenu([...opcoesMenu, {
      id: newId,
      texto: 'Nova opção',
      resposta: 'Resposta automática...',
      ativo: true
    }]);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-mint flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
              <p className="text-muted-foreground">
                Integração com UAZAP para automações
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="conexao" className="animate-slide-up">
          <TabsList className="bg-muted flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="conexao" className="gap-2">
              <QrCode className="w-4 h-4" />
              Conexão
            </TabsTrigger>
            <TabsTrigger value="menu" className="gap-2">
              <Bot className="w-4 h-4" />
              Menu Conversa
            </TabsTrigger>
            <TabsTrigger value="disparos" className="gap-2">
              <Send className="w-4 h-4" />
              Disparos
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <Clock className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Conexão WhatsApp */}
          <TabsContent value="conexao" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Configurar API UAZAP
                  </CardTitle>
                  <CardDescription>
                    Insira a URL da API e o Token da sua instância UAZAP
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-url">URL da API *</Label>
                    <Input 
                      id="api-url"
                      placeholder="https://sua-instancia.uazapi.com"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
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
                      value={instanceToken}
                      onChange={(e) => setInstanceToken(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      O token é gerado quando você cria a instância no painel UAZAP
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={handleTestConnection}
                      disabled={!apiUrl || !instanceToken || isTesting}
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
                      <Button variant="outline" onClick={handleDisconnect}>
                        Desconectar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status da Conexão</CardTitle>
                  <CardDescription>
                    Verifique se a API está configurada corretamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "p-6 rounded-xl text-center",
                    connectionStatus === 'connected' ? "bg-mint-light" : "bg-muted"
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                      connectionStatus === 'connected' ? "bg-secondary" : 
                      connectionStatus === 'connecting' ? "bg-honey" : "bg-muted-foreground/20"
                    )}>
                      {connectionStatus === 'connecting' ? (
                        <Clock className="w-8 h-8 text-accent-foreground animate-spin" />
                      ) : (
                        <Smartphone className={cn(
                          "w-8 h-8",
                          connectionStatus === 'connected' ? "text-secondary-foreground" : "text-muted-foreground"
                        )} />
                      )}
                    </div>
                    <p className={cn(
                      "font-semibold",
                      connectionStatus === 'connected' ? "text-secondary" : 
                      connectionStatus === 'connecting' ? "text-accent-foreground" : "text-muted-foreground"
                    )}>
                      {connectionStatus === 'connected' ? 'API Conectada' : 
                       connectionStatus === 'connecting' ? 'Testando conexão...' : 'Não Configurado'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {connectionStatus === 'connected' 
                        ? 'Pronto para enviar mensagens e usar automações' 
                        : 'Configure a URL e Token para conectar'}
                    </p>
                    
                    {connectionStatus === 'connected' && (
                      <div className="mt-4 p-3 rounded-lg bg-background/50 text-left">
                        <p className="text-xs font-medium text-foreground mb-1">Configuração ativa:</p>
                        <p className="text-xs text-muted-foreground truncate">{apiUrl}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Menu de Conversa */}
          <TabsContent value="menu" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-primary" />
                        Menu Interativo
                      </CardTitle>
                      <CardDescription>
                        Configure o menu automático que aparece quando o lead envia mensagem
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="menu-ativo">Menu Ativo</Label>
                      <Switch
                        id="menu-ativo"
                        checked={menuAtivo}
                        onCheckedChange={setMenuAtivo}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Mensagem de Boas-vindas</Label>
                    <Textarea
                      value={mensagemBoasVindas}
                      onChange={(e) => setMensagemBoasVindas(e.target.value)}
                      className="min-h-20"
                      placeholder="Olá! Seja bem-vindo..."
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Opções do Menu</Label>
                      <Button variant="outline" size="sm" onClick={handleAddMenuOption}>
                        <List className="w-4 h-4 mr-2" />
                        Adicionar opção
                      </Button>
                    </div>
                    
                    {opcoesMenu.map((opcao, index) => (
                      <div 
                        key={opcao.id}
                        className="p-4 rounded-xl border bg-card space-y-3 animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Opção {opcao.id}</Badge>
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

                  <Button className="w-full" disabled={!menuAtivo}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar Menu
                  </Button>
                </CardContent>
              </Card>

              {/* Preview do Menu */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview do Menu</CardTitle>
                  <CardDescription>
                    Assim ficará a mensagem no WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10 p-4 rounded-xl max-w-sm mx-auto">
                    <div className="bg-white dark:bg-card p-3 rounded-lg shadow-sm">
                      <p className="text-sm text-foreground">{mensagemBoasVindas}</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      {opcoesMenu.filter(o => o.ativo).map((opcao) => (
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

          {/* Disparos em Massa */}
          <TabsContent value="disparos" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Importar Base de Leads
                  </CardTitle>
                  <CardDescription>
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

                  {leads.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="gap-1">
                          <Users className="w-3 h-3" />
                          {leads.length} leads
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={handleClearLeads}>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                    Configurar Disparo
                  </CardTitle>
                  <CardDescription>
                    Defina a mensagem e delays entre envios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mensagem do Disparo</Label>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delay Mínimo (seg)</Label>
                      <Input
                        type="number"
                        value={delayMin}
                        onChange={(e) => setDelayMin(Number(e.target.value))}
                        min={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Delay Máximo (seg)</Label>
                      <Input
                        type="number"
                        value={delayMax}
                        onChange={(e) => setDelayMax(Number(e.target.value))}
                        min={delayMin}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
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
                        disabled={connectionStatus !== 'connected' || leads.length === 0}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Iniciar Disparo
                      </Button>
                    )}
                  </div>

                  {connectionStatus !== 'connected' && (
                    <p className="text-xs text-center text-muted-foreground">
                      Conecte seu WhatsApp primeiro para fazer disparos
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {templates.map((template, index) => (
                <Card 
                  key={template.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="text-xl">{template.icone}</span>
                        {template.titulo}
                      </CardTitle>
                      <Switch 
                        checked={template.ativo}
                        onCheckedChange={() => handleToggleTemplate(template.id)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={template.mensagem}
                      className="min-h-24 resize-none"
                      placeholder="Mensagem do template..."
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {'{{nome_pet}}'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {'{{nome_tutor}}'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {'{{data_checkin}}'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="historico" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mensagens Enviadas</CardTitle>
                <CardDescription>
                  Histórico de todas as mensagens automáticas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mensagensEnviadas.map((msg, index) => (
                    <div 
                      key={msg.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        msg.status === 'enviada' ? "bg-mint-light" : "bg-honey-light"
                      )}>
                        {msg.status === 'enviada' ? (
                          <CheckCircle className="w-5 h-5 text-secondary" />
                        ) : (
                          <Clock className="w-5 h-5 text-accent-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {templates.find(t => t.id === msg.tipo)?.titulo}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {msg.pet} • {msg.tutor}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {new Date(msg.data).toLocaleDateString('pt-BR')}
                        </p>
                        <Badge 
                          variant={msg.status === 'enviada' ? 'default' : 'secondary'}
                          className={cn(
                            "text-xs",
                            msg.status === 'enviada' 
                              ? "bg-secondary text-secondary-foreground" 
                              : "bg-honey-light text-accent-foreground"
                          )}
                        >
                          {msg.status === 'enviada' ? 'Enviada' : 'Agendada'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

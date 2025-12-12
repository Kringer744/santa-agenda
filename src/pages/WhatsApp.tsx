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
  const [uazapToken, setUazapToken] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [uazapUrl, setUazapUrl] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [templates, setTemplates] = useState(mensagensTemplate);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  
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

  const handleCreateInstance = async () => {
    if (!adminToken || !instanceName || !uazapUrl) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setConnectionStatus('connecting');
    
    // Simula criação da instância e geração do QR Code
    setTimeout(() => {
      // Em produção, aqui faria a chamada real para a API UAZAP
      // POST /instance/create com { name: instanceName }
      setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAABlBMVEX///8AAABVwtN+AAADaElEQVR42u3dW47DIAwF0Oz/ozNSVSnNBOw4D+D0e9SS+QLGNsnPj+MsZ8k5cs7P53f/4fw8/yB/L/9SfiP/0v5m/UP9x/oH+sf7l/ZP9x/rP+q/3X/xc/5H/1n/wf95/8X/ef/J/3n/0f95/9H/ef/Z/3n/4f95/+n/ef/5/3H/hf95/wX/B/1X+y/4P+i/4v+g/5L/g/5r/g/6L/o/6L/q/6D/sv+D/uv+D/ov/B/0X/l/0H/p/0H/tf8H/Rf/H/Rf/X/Qf/n/Qf/1/wf9D/wf9D/xf9D/yP9B/6P/A/8n/Q/9n/Q/9n/U/+j/Wf9z/of+7/uf+7/wf/B/4v+5/8v/B/9P/l/8P/p/9P/t/9v/x/+P/2/+//4//j/+v/7//z//P/+//9f/9f/+v/+P/6f/8//8//8f/6//9//6v/9//6//9//6//9//7/7/3/wP/+P/5f/7//1f/6//9f/+f/5f/7f/5//9//6//9//6//9//5f/7f/5//9//6//9//6//9//5f/7f/5//9f/+v/+f/5f/7f/5//9f/+v/+f/5f/7f/5//8//6//9//6//9f/+f/5f/7//1//6//9f/+f/5f/7//1//6//9f/+f/5f/7f/5//9f/+v/+f/5f/7f/5//9f/+v/+f/5f/7f/5//9f/+v/+f/5f/7f/5//8//+v/+f/5f/7//1//6//9f/+f/5f/7//1//6//9f/+f/5f/7//1//6//9f/+f/5f/7//1//6//9f/+f/5f/7//1//6//9f/+f/5f/7f/5//9f/+v/+f/5f/7f/5//9f/+v/+f/5f/7f/5//9f/+v/+f/5f/7f/5//9f/+v/+f/5f/7f/5');
      toast.success('Instância criada! Escaneie o QR Code');
    }, 2000);
  };

  const handleScanComplete = () => {
    setConnectionStatus('connected');
    setQrCode(null);
    toast.success('WhatsApp conectado com sucesso!');
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
                    Criar Instância UAZAP
                  </CardTitle>
                  <CardDescription>
                    Configure e conecte seu WhatsApp via QR Code
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="uazap-url">URL da API *</Label>
                    <Input 
                      id="uazap-url"
                      placeholder="https://sua-instancia.uazapi.com"
                      value={uazapUrl}
                      onChange={(e) => setUazapUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-token">Admin Token *</Label>
                    <Input 
                      id="admin-token"
                      type="password"
                      placeholder="Seu token de administrador"
                      value={adminToken}
                      onChange={(e) => setAdminToken(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instance-name">Nome da Instância *</Label>
                    <Input 
                      id="instance-name"
                      placeholder="hotel-pets-principal"
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateInstance}
                    disabled={!uazapUrl || !adminToken || !instanceName || connectionStatus === 'connecting'}
                  >
                    {connectionStatus === 'connecting' ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Criando instância...
                      </>
                    ) : connectionStatus === 'connected' ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Conectado
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Gerar QR Code
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conectar WhatsApp</CardTitle>
                  <CardDescription>
                    Escaneie o QR Code com seu celular
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "p-6 rounded-xl text-center",
                    connectionStatus === 'connected' ? "bg-mint-light" : "bg-muted"
                  )}>
                    {qrCode ? (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl inline-block mx-auto">
                          <div className="w-48 h-48 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                            <QrCode className="w-32 h-32 text-foreground" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Abra o WhatsApp no celular, vá em Dispositivos Conectados e escaneie
                        </p>
                        <Button onClick={handleScanComplete} variant="outline">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Já escanei
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className={cn(
                          "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                          connectionStatus === 'connected' ? "bg-secondary" : "bg-muted-foreground/20"
                        )}>
                          <Smartphone className={cn(
                            "w-8 h-8",
                            connectionStatus === 'connected' ? "text-secondary-foreground" : "text-muted-foreground"
                          )} />
                        </div>
                        <p className={cn(
                          "font-semibold",
                          connectionStatus === 'connected' ? "text-secondary" : "text-muted-foreground"
                        )}>
                          {connectionStatus === 'connected' ? 'WhatsApp Conectado' : 'Não Conectado'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {connectionStatus === 'connected' 
                            ? 'Pronto para enviar mensagens' 
                            : 'Clique em "Gerar QR Code" para iniciar'}
                        </p>
                      </>
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

import { useState } from 'react';
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
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function WhatsApp() {
  const [uazapToken, setUazapToken] = useState('');
  const [uazapUrl, setUazapUrl] = useState('');
  const [templates, setTemplates] = useState(mensagensTemplate);
  const [isConnected, setIsConnected] = useState(false);

  const handleToggleTemplate = (id: string) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, ativo: !t.ativo } : t
    ));
  };

  const handleConnect = () => {
    if (uazapToken && uazapUrl) {
      setIsConnected(true);
    }
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

        <Tabs defaultValue="config" className="animate-slide-up">
          <TabsList className="bg-muted">
            <TabsTrigger value="config" className="gap-2">
              <Settings className="w-4 h-4" />
              Configuração
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

          {/* Configuração */}
          <TabsContent value="config" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Conexão UAZAP
                  </CardTitle>
                  <CardDescription>
                    Configure sua instância do UAZAP para envio de mensagens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="uazap-url">URL da API</Label>
                    <Input 
                      id="uazap-url"
                      placeholder="https://sua-instancia.uazap.io"
                      value={uazapUrl}
                      onChange={(e) => setUazapUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uazap-token">Token de Acesso</Label>
                    <Input 
                      id="uazap-token"
                      type="password"
                      placeholder="Seu token UAZAP"
                      value={uazapToken}
                      onChange={(e) => setUazapToken(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleConnect}
                    disabled={!uazapUrl || !uazapToken}
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Conectado
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4 mr-2" />
                        Conectar
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status da Conexão</CardTitle>
                  <CardDescription>
                    Informações sobre sua instância WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "p-6 rounded-xl text-center",
                    isConnected ? "bg-mint-light" : "bg-muted"
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                      isConnected ? "bg-secondary" : "bg-muted-foreground/20"
                    )}>
                      <MessageSquare className={cn(
                        "w-8 h-8",
                        isConnected ? "text-secondary-foreground" : "text-muted-foreground"
                      )} />
                    </div>
                    <p className={cn(
                      "font-semibold",
                      isConnected ? "text-secondary" : "text-muted-foreground"
                    )}>
                      {isConnected ? 'WhatsApp Conectado' : 'Não Conectado'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isConnected 
                        ? 'Pronto para enviar mensagens' 
                        : 'Configure sua instância UAZAP'}
                    </p>
                  </div>
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

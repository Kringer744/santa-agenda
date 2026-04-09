import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Bot, Save, Loader2, Plus, Trash2, Edit, Zap, Clock, MessageSquare,
  Brain, Activity, Eye, EyeOff, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useIAConfig, useUpdateIAConfig,
  useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate,
  useIALogs,
} from '@/hooks/useIAConfig';
import { IAConfig, WhatsAppTemplate } from '@/types';
import { format } from 'date-fns';

const TEMPLATE_TIPOS = [
  { value: 'confirmacao_consulta', label: 'Confirmacao de Consulta' },
  { value: 'lembrete_consulta', label: 'Lembrete de Consulta' },
  { value: 'aniversario_paciente', label: 'Aniversario' },
  { value: 'pos_consulta', label: 'Pos-Consulta' },
  { value: 'retorno', label: 'Lembrete de Retorno' },
];

const VARIAVEIS_DISPONIVEIS = [
  '{{nome_paciente}}', '{{nome_dentista}}', '{{data_consulta}}', '{{hora_consulta}}', '{{nome}}',
];

export default function IAConfigPage() {
  const { data: iaConfig, isLoading: loadingConfig } = useIAConfig();
  const updateConfig = useUpdateIAConfig();
  const { data: templates = [], isLoading: loadingTemplates } = useTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const { data: logs = [], isLoading: loadingLogs } = useIALogs(30);

  const [config, setConfig] = useState<Partial<IAConfig>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);

  useEffect(() => {
    if (iaConfig) setConfig(iaConfig);
  }, [iaConfig]);

  const handleSaveConfig = () => {
    updateConfig.mutate({ ...config, id: iaConfig?.id });
  };

  const handleSaveTemplate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      nome: fd.get('nome') as string,
      tipo: fd.get('tipo') as string,
      mensagem: fd.get('mensagem') as string,
      delay_horas: parseInt(fd.get('delay_horas') as string) || 0,
      ativo: true,
    };

    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, ...data }, {
        onSuccess: () => { setIsTemplateDialogOpen(false); setEditingTemplate(null); },
      });
    } else {
      createTemplate.mutate(data, {
        onSuccess: () => setIsTemplateDialogOpen(false),
      });
    }
  };

  if (loadingConfig) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Bot className="text-primary" /> Inteligencia Artificial
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Configure a IA que responde automaticamente no WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="ia-toggle" className="text-sm font-medium">IA Ativa</Label>
              <Switch
                id="ia-toggle"
                checked={config.ativo || false}
                onCheckedChange={(checked) => setConfig(p => ({ ...p, ativo: checked }))}
              />
            </div>
            <Badge variant={config.ativo ? "default" : "secondary"} className="text-xs">
              {config.ativo ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="config"><Brain className="w-4 h-4 mr-2" />Configuracao</TabsTrigger>
            <TabsTrigger value="templates"><FileText className="w-4 h-4 mr-2" />Templates</TabsTrigger>
            <TabsTrigger value="logs"><Activity className="w-4 h-4 mr-2" />Logs</TabsTrigger>
          </TabsList>

          {/* ---- TAB: CONFIGURACAO ---- */}
          <TabsContent value="config">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Conexao LLM</CardTitle>
                  <CardDescription>Configure o provider de IA (OpenRouter recomendado)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Select value={config.provider || 'openrouter'} onValueChange={v => setConfig(p => ({ ...p, provider: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openrouter">OpenRouter (recomendado)</SelectItem>
                          <SelectItem value="openai">OpenAI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={config.api_key || ''}
                          onChange={e => setConfig(p => ({ ...p, api_key: e.target.value }))}
                          placeholder="sk-or-..."
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                          {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Modelo Principal (complexo)</Label>
                      <Input
                        value={config.modelo_principal || ''}
                        onChange={e => setConfig(p => ({ ...p, modelo_principal: e.target.value }))}
                        placeholder="google/gemini-2.0-flash-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Modelo Lite (perguntas simples)</Label>
                      <Input
                        value={config.modelo_lite || ''}
                        onChange={e => setConfig(p => ({ ...p, modelo_lite: e.target.value }))}
                        placeholder="google/gemini-2.0-flash-lite-001"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Tokens Resposta</Label>
                      <Input
                        type="number"
                        value={config.max_tokens_resposta || 500}
                        onChange={e => setConfig(p => ({ ...p, max_tokens_resposta: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Temperatura (0.0 - 1.0)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={config.temperatura || 0.7}
                        onChange={e => setConfig(p => ({ ...p, temperatura: parseFloat(e.target.value) }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Personalidade da IA</CardTitle>
                  <CardDescription>Defina como a IA deve se comportar e responder</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Clinica</Label>
                      <Input
                        value={config.nome_clinica || ''}
                        onChange={e => setConfig(p => ({ ...p, nome_clinica: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Endereco</Label>
                      <Input
                        value={config.endereco || ''}
                        onChange={e => setConfig(p => ({ ...p, endereco: e.target.value }))}
                        placeholder="Av. Paulista, 1000 - SP"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Personalidade / Prompt de Sistema</Label>
                    <Textarea
                      className="min-h-[120px]"
                      value={config.personalidade || ''}
                      onChange={e => setConfig(p => ({ ...p, personalidade: e.target.value }))}
                      placeholder="Voce e a assistente virtual da clinica..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instrucoes Adicionais</Label>
                    <Textarea
                      className="min-h-[80px]"
                      value={config.instrucoes_adicionais || ''}
                      onChange={e => setConfig(p => ({ ...p, instrucoes_adicionais: e.target.value }))}
                      placeholder="Regras extras, promocoes ativas, avisos..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSaveConfig} className="w-full" size="lg" disabled={updateConfig.isPending}>
                {updateConfig.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Configuracoes
              </Button>
            </div>
          </TabsContent>

          {/* ---- TAB: TEMPLATES ---- */}
          <TabsContent value="templates">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Templates de Mensagem</CardTitle>
                  <CardDescription>Mensagens automaticas enviadas pelo sistema</CardDescription>
                </div>
                <Dialog open={isTemplateDialogOpen} onOpenChange={(open) => {
                  setIsTemplateDialogOpen(open);
                  if (!open) setEditingTemplate(null);
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Novo Template</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{editingTemplate ? 'Editar Template' : 'Novo Template'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveTemplate} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input name="nome" required defaultValue={editingTemplate?.nome} placeholder="Lembrete 1 dia antes" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select name="tipo" defaultValue={editingTemplate?.tipo || 'lembrete_consulta'}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TEMPLATE_TIPOS.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Horas antes (lembretes)</Label>
                          <Input name="delay_horas" type="number" defaultValue={editingTemplate?.delay_horas || 24} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <Textarea
                          name="mensagem"
                          required
                          className="min-h-[120px]"
                          defaultValue={editingTemplate?.mensagem}
                          placeholder="Ola {{nome_paciente}}! Sua consulta..."
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {VARIAVEIS_DISPONIVEIS.map(v => (
                            <Badge key={v} variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/10" onClick={() => {
                              const textarea = document.querySelector('textarea[name="mensagem"]') as HTMLTextAreaElement;
                              if (textarea) {
                                const pos = textarea.selectionStart;
                                const val = textarea.value;
                                textarea.value = val.slice(0, pos) + v + val.slice(pos);
                                textarea.focus();
                              }
                            }}>
                              {v}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={createTemplate.isPending || updateTemplate.isPending}>
                        {(createTemplate.isPending || updateTemplate.isPending) ? <Loader2 className="animate-spin" /> : 'Salvar Template'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingTemplates ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
                ) : templates.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhum template. Execute a migration para criar os templates padrao.</p>
                ) : (
                  templates.map(template => (
                    <div key={template.id} className="p-4 border rounded-xl flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm">{template.nome}</h4>
                          <Badge variant="secondary" className="text-[9px]">{template.tipo}</Badge>
                          {template.delay_horas > 0 && (
                            <Badge variant="outline" className="text-[9px]">
                              <Clock size={10} className="mr-1" />{template.delay_horas}h antes
                            </Badge>
                          )}
                          <Badge variant={template.ativo ? "default" : "secondary"} className="text-[9px]">
                            {template.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{template.mensagem}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                          setEditingTemplate(template);
                          setIsTemplateDialogOpen(true);
                        }}>
                          <Edit size={14} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover template?</AlertDialogTitle>
                              <AlertDialogDescription>Deseja remover "{template.nome}"?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Nao</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTemplate.mutate(template.id)} className="bg-destructive text-destructive-foreground">Sim</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---- TAB: LOGS ---- */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Logs da IA</CardTitle>
                <CardDescription>Ultimas interacoes processadas pela IA (atualiza a cada 30s)</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
                ) : logs.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhum log ainda. A IA precisa estar ativa e receber mensagens.</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {logs.map(log => (
                      <div key={log.id} className="p-3 border rounded-lg text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-mono">{log.telefone}</Badge>
                            <Badge variant="secondary" className="text-[9px]">{log.intencao}</Badge>
                            <Badge variant="outline" className="text-[9px]">{log.modelo_usado}</Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(log.created_at), 'dd/MM HH:mm')}
                            {log.tempo_resposta_ms > 0 && ` (${log.tempo_resposta_ms}ms)`}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="p-2 bg-muted/30 rounded text-xs">
                            <span className="font-bold text-muted-foreground">Recebido:</span> {log.mensagem_recebida}
                          </div>
                          <div className="p-2 bg-primary/5 rounded text-xs">
                            <span className="font-bold text-primary">IA:</span> {log.resposta_ia?.substring(0, 200)}
                          </div>
                        </div>
                        {(log.tokens_entrada > 0 || log.tokens_saida > 0) && (
                          <div className="text-[10px] text-muted-foreground">
                            Tokens: {log.tokens_entrada} in / {log.tokens_saida} out
                          </div>
                        )}
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

"use client";

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Trash2, Save, Wifi, WifiOff, Loader2, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { 
  testConnection, 
  getWhatsAppConfig,
  updateWhatsAppConfig,
} from '@/lib/uazap';
import { WhatsAppMenuConfig, WhatsAppMenuOption } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_MENU_CONFIG: WhatsAppMenuConfig = {
  api_url: '',
  instance_token: '',
  mensagem_boas_vindas: 'Olá! 🦷 Seja bem-vindo à nossa Clínica Odontológica. Como podemos cuidar do seu sorriso hoje?',
  menu_ativo: false,
  opcoes_menu: [
    { id: '1', texto: '🗓️ Agendar uma consulta', resposta: 'Ótimo! Para agendar sua consulta, acesse nosso link: https://dental-clinic.lovable.app/client-appointment', ativo: true },
    { id: '2', texto: '🦷 Conhecer procedimentos', resposta: 'Temos diversos procedimentos: Limpeza, Clareamento, Ortodontia e mais.', ativo: true },
    { id: '3', texto: '📞 Falar com atendimento', resposta: 'Vou transferir você para um atendente. Aguarde um momento!', ativo: true },
  ],
  footer_text: 'DentalClinic - Atendimento Automático',
  list_button_text: 'Ver Opções',
  parabens_automatico: false,
};

export default function WhatsApp() {
  const [config, setConfig] = useState<WhatsAppMenuConfig>(DEFAULT_MENU_CONFIG);
  const [birthdayMessage, setBirthdayMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConfig();
    loadBirthdayTemplate();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getWhatsAppConfig();
      if (data) {
        setConfig({
          ...DEFAULT_MENU_CONFIG,
          ...data,
          parabens_automatico: (data as any).parabens_automatico || false
        });
        if (data.api_url && data.instance_token) setConnectionStatus('connected');
      }
    } catch (error) { 
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const loadBirthdayTemplate = async () => {
    const { data } = await supabase
      .from('whatsapp_templates')
      .select('mensagem')
      .eq('tipo', 'aniversario_paciente')
      .maybeSingle();
    
    if (data) setBirthdayMessage(data.mensagem);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // Salva a configuração geral
      const updatedConfig = await updateWhatsAppConfig(config);
      setConfig(prev => ({ ...prev, id: updatedConfig.id }));

      // Salva o template de aniversário
      await supabase
        .from('whatsapp_templates')
        .upsert({ 
          tipo: 'aniversario_paciente', 
          nome: 'Parabéns ao Paciente',
          mensagem: birthdayMessage,
          ativo: true 
        }, { onConflict: 'tipo' });

      toast.success('Configurações salvas com sucesso!');
    } catch (error) { 
      toast.error('Erro ao salvar configuração'); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.api_url || !config.instance_token) {
      toast.error('URL e Token são necessários.');
      return;
    }
    setIsTesting(true);
    setConnectionStatus('connecting');
    const result = await testConnection({ apiUrl: config.api_url, instanceToken: config.instance_token });
    if (result.success) {
      setConnectionStatus('connected');
      toast.success('Conectado!');
    } else {
      setConnectionStatus('disconnected');
      toast.error('Falha na conexão.');
    }
    setIsTesting(false);
  };

  const handleAddMenuOption = () => {
    const newOption: WhatsAppMenuOption = {
      id: Math.random().toString(36).substr(2, 9),
      texto: '',
      resposta: '',
      ativo: true,
    };
    setConfig(prev => ({ ...prev, opcoes_menu: [...prev.opcoes_menu, newOption] }));
  };

  const handleUpdateMenuOption = (id: string, fields: Partial<WhatsAppMenuOption>) => {
    setConfig(prev => ({
      ...prev,
      opcoes_menu: prev.opcoes_menu.map(opt => opt.id === id ? { ...opt, ...fields } : opt)
    }));
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
              <p className="text-muted-foreground text-sm">Configure automações e atendimento</p>
            </div>
          </div>

          <div className={cn(
            "px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium",
            connectionStatus === 'connected' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          )}>
            {connectionStatus === 'connected' ? <Wifi size={16} /> : <WifiOff size={16} />}
            {connectionStatus === 'connected' ? 'Online' : 'Offline'}
          </div>
        </div>

        <Tabs defaultValue="conexao" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="conexao">Conexão</TabsTrigger>
            <TabsTrigger value="automacao">Automações</TabsTrigger>
            <TabsTrigger value="menu">Menu Interativo</TabsTrigger>
          </TabsList>

          <TabsContent value="conexao">
            <Card>
              <CardHeader>
                <CardTitle>Configuração UAZAP</CardTitle>
                <CardDescription>Conecte sua instância para enviar mensagens.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>URL da API</Label>
                    <Input value={config.api_url} onChange={e => setConfig(p => ({ ...p, api_url: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Token da Instância</Label>
                    <Input type="password" value={config.instance_token} onChange={e => setConfig(p => ({ ...p, instance_token: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleTestConnection} disabled={isTesting} className="flex-1">
                    {isTesting ? <Loader2 className="animate-spin mr-2" /> : <Wifi className="mr-2" />}
                    Testar Conexão
                  </Button>
                  <Button variant="outline" onClick={handleSaveConfig} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automacao">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="text-primary" />
                  Disparos Automáticos
                </CardTitle>
                <CardDescription>O sistema enviará mensagens ao abrir o Dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">Lembretes de Consulta</p>
                      <p className="text-sm text-muted-foreground">Envia lembretes para Hoje e Amanhã automaticamente.</p>
                    </div>
                    <Badge variant="outline" className="text-emerald-600 bg-emerald-50">Sempre Ativo</Badge>
                  </div>
                  
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">Parabéns Automático</p>
                        <p className="text-sm text-muted-foreground">Envia mensagem no dia do aniversário do paciente.</p>
                      </div>
                      <Switch 
                        checked={config.parabens_automatico} 
                        onCheckedChange={(val) => setConfig(p => ({ ...p, parabens_automatico: val }))}
                      />
                    </div>
                    
                    {config.parabens_automatico && (
                      <div className="space-y-2 animate-fade-in">
                        <Label htmlFor="birthday_msg">Mensagem de Parabéns</Label>
                        <Textarea 
                          id="birthday_msg"
                          value={birthdayMessage}
                          onChange={(e) => setBirthdayMessage(e.target.value)}
                          placeholder="Use {{nome}} para o nome do paciente..."
                          className="min-h-[100px]"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Sugestão: Olá {"{{nome}}"}! 🎂 A equipe da DentalClinic passa para desejar um feliz aniversário!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button onClick={handleSaveConfig} disabled={isSaving} className="w-full">
                  Salvar Preferências de Automação
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Menu Interativo</CardTitle>
                </div>
                <Switch 
                  checked={config.menu_ativo} 
                  onCheckedChange={(val) => setConfig(p => ({ ...p, menu_ativo: val }))} 
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título do Menu</Label>
                  <Input value={config.mensagem_boas_vindas} onChange={e => setConfig(p => ({ ...p, mensagem_boas_vindas: e.target.value }))} />
                </div>
                
                <div className="space-y-3 pt-4">
                  {config.opcoes_menu.map((option, idx) => (
                    <div key={option.id} className="p-4 border rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold">Opção {idx + 1}</Label>
                        <Button variant="ghost" size="icon" onClick={() => setConfig(p => ({ ...p, opcoes_menu: p.opcoes_menu.filter(o => o.id !== option.id) }))}>
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>
                      <Input value={option.texto} onChange={e => handleUpdateMenuOption(option.id, { texto: e.target.value })} placeholder="Texto do botão" />
                      <Textarea value={option.resposta} onChange={e => handleUpdateMenuOption(option.id, { resposta: e.target.value })} placeholder="Resposta automática" />
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={handleAddMenuOption}>
                    <Plus size={16} className="mr-2" /> Adicionar Opção
                  </Button>
                </div>
                
                <Button onClick={handleSaveConfig} className="w-full">Salvar Menu</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
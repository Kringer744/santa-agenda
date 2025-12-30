"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { testConnection, createBulkCampaign } from '@/lib/uazap';
import { getPatientsWithBirthdayToday, sendBirthdayMessage } from '@/lib/whatsappClinicAutomation';
import { Paciente } from '@/types';

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
      { id: '1', texto: '🗓️ Agendar uma consulta', resposta: 'Ótimo! Vamos iniciar seu agendamento. Qual a data e horário preferidos?', ativo: true },
      { id: '2', texto: '🦷 Conhecer procedimentos', resposta: 'Temos diversos procedimentos para cuidar da sua saúde bucal. Qual você gostaria de saber mais?', ativo: true },
      { id: '3', texto: '📞 Falar com atendimento', resposta: 'Vou transferir você para um atendente. Aguarde um momento!', ativo: true },
    ],
  });

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isTesting, setIsTesting] = useState(false);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const allLeads = useMemo(() => leads, [leads]);
  const [mensagemDisparo, setMensagemDisparo] = useState('');
  const [disparoAtivo, setDisparoAtivo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [birthdayPatientsToday, setBirthdayPatientsToday] = useState<Paciente[]>([]);
  const [isSendingBirthdays, setIsSendingBirthdays] = useState(false);
  const [selectedBirthdayTemplateId, setSelectedBirthdayTemplateId] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadConfig();
    loadTemplates();
    const fetchBirthdays = async () => {
      const patients = await getPatientsWithBirthdayToday();
      setBirthdayPatientsToday(patients);
    };
    fetchBirthdays();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.from('whatsapp_config').select('*').limit(1).maybeSingle();
      if (error) throw error;
      if (data) {
        const d = data as any;
        const opcoesMenu = Array.isArray(d.opcoes_menu) ? (d.opcoes_menu as unknown as MenuOption[]) : [];
        setConfig({
          id: d.id,
          api_url: d.api_url,
          instance_token: d.instance_token,
          menu_ativo: d.menu_ativo || false,
          mensagem_boas_vindas: d.mensagem_boas_vindas || '',
          opcoes_menu: opcoesMenu,
        });
        if (d.api_url && d.instance_token) setConnectionStatus('connected');
      }
    } catch (error) { console.error('Erro ao carregar configuração:', error); }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase.from('whatsapp_templates').select('*').order('tipo');
      if (error) throw error;
      if (data) setTemplates(data as any as WhatsAppTemplate[]);
    } catch (error) { console.error('Erro ao carregar templates:', error); }
  };

  const handleSaveConfig = async () => {
    if (!config.api_url || !config.instance_token) {
      toast.error('Preencha a URL da API e o Token');
      return;
    }
    try {
      if (config.id) {
        await (supabase.from('whatsapp_config') as any).update({
          api_url: config.api_url,
          instance_token: config.instance_token,
          menu_ativo: config.menu_ativo,
          mensagem_boas_vindas: config.mensagem_boas_vindas,
          opcoes_menu: config.opcoes_menu,
        }).eq('id', config.id);
      } else {
        const { data } = await (supabase.from('whatsapp_config') as any).insert([{
          api_url: config.api_url,
          instance_token: config.instance_token,
          menu_ativo: config.menu_ativo,
          mensagem_boas_vindas: config.mensagem_boas_vindas,
          opcoes_menu: config.opcoes_menu,
        }]).select().single();
        if (data) setConfig(prev => ({ ...prev, id: (data as any).id }));
      }
      toast.success('Configuração salva!');
    } catch (error) { toast.error('Erro ao salvar configuração'); }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('connecting');
    const result = await testConnection({ apiUrl: config.api_url, instanceToken: config.instance_token });
    if (result.success) {
      setConnectionStatus('connected');
      toast.success('Conexão testada com sucesso!');
      await handleSaveConfig();
    } else {
      setConnectionStatus('disconnected');
      toast.error(result.error || 'Falha na conexão');
    }
    setIsTesting(false);
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
      toast.success(`${newLeads.length} leads carregados!`);
    };
    reader.readAsText(file);
  };

  const handleStartDisparo = async () => {
    if (!mensagemDisparo.trim() || allLeads.length === 0) {
      toast.error('Preencha a mensagem e adicione leads');
      return;
    }
    setDisparoAtivo(true);
    const result = await createBulkCampaign({ apiUrl: config.api_url, instanceToken: config.instance_token }, allLeads, mensagemDisparo, 10, 30);
    if (result.success) {
      toast.success('Campanha iniciada!');
      await (supabase.from('whatsapp_campaigns') as any).insert({
        nome: `Campanha ${new Date().toLocaleDateString('pt-BR')}`,
        mensagem: mensagemDisparo,
        delay_min: 10,
        delay_max: 30,
        status: 'sending',
        total_leads: allLeads.length,
      });
    } else { toast.error(result.error || 'Erro ao criar campanha'); }
    setDisparoAtivo(false);
  };

  const handleSendBirthdayMessages = async () => {
    if (connectionStatus !== 'connected' || birthdayPatientsToday.length === 0 || !selectedBirthdayTemplateId) return;
    const template = templates.find(t => t.id === selectedBirthdayTemplateId);
    if (!template) return;
    setIsSendingBirthdays(true);
    for (const patient of birthdayPatientsToday) {
      await sendBirthdayMessage(patient, { ...template, ativo: template.ativo || false }, { apiUrl: config.api_url, instanceToken: config.instance_token });
    }
    toast.success('Mensagens de aniversário enviadas!');
    setIsSendingBirthdays(false);
  };

  const birthdayTemplates = useMemo(() => templates.filter(t => t.tipo === 'aniversario_paciente'), [templates]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-mint" />
          <h1 className="text-2xl font-bold">WhatsApp</h1>
        </div>

        <Tabs defaultValue="conexao">
          <TabsList>
            <TabsTrigger value="conexao">Conexão</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="disparos">Disparos</TabsTrigger>
          </TabsList>

          <TabsContent value="conexao">
            <Card>
              <CardHeader><CardTitle>Configuração UAZAP</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="URL da API" value={config.api_url} onChange={e => setConfig(p => ({ ...p, api_url: e.target.value }))} />
                <Input type="password" placeholder="Token" value={config.instance_token} onChange={e => setConfig(p => ({ ...p, instance_token: e.target.value }))} />
                <Button onClick={handleTestConnection} disabled={isTesting}>{isTesting ? 'Testando...' : 'Conectar'}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disparos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Aniversariantes ({birthdayPatientsToday.length})</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedBirthdayTemplateId} onValueChange={setSelectedBirthdayTemplateId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o template" /></SelectTrigger>
                    <SelectContent>{birthdayTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button className="w-full" onClick={handleSendBirthdayMessages} disabled={isSendingBirthdays || birthdayPatientsToday.length === 0}>
                    {isSendingBirthdays ? 'Enviando...' : 'Enviar Aniversários'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Campanha em Massa</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>Carregar Leads</Button>
                  <Textarea placeholder="Mensagem" value={mensagemDisparo} onChange={e => setMensagemDisparo(e.target.value)} />
                  <Button className="w-full" onClick={handleStartDisparo} disabled={disparoAtivo || allLeads.length === 0}>
                    {disparoAtivo ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    Iniciar Campanha ({allLeads.length})
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
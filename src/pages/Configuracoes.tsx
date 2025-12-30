import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, DollarSign, Pencil, Trash2, Loader2, Banknote, CheckCircle, XCircle, Info, Save } from 'lucide-react';
import { useUnidades, useCreateUnidade, useDeleteUnidade } from '@/hooks/useUnidades';
import { useServicos, useCreateServico, useUpdateServico } from '@/hooks/useServicos';
import { useItauSettings, useSaveItauSettings } from '@/hooks/useItauSettings'; // Import new hooks
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Configuracoes() {
  const [isUnidadeDialogOpen, setIsUnidadeDialogOpen] = useState(false);
  const [isServicoDialogOpen, setIsServicoDialogOpen] = useState(false);
  const [itauConfigured, setItauConfigured] = useState(false);
  const [loadingItauStatus, setLoadingItauStatus] = useState(true);
  
  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades();
  const { data: servicos = [], isLoading: loadingServicos } = useServicos();
  const { data: itauSettings, isLoading: loadingItauSettings } = useItauSettings(); // Fetch Itaú settings
  const saveItauSettings = useSaveItauSettings(); // Hook to save Itaú settings

  // State for Itaú Pix form
  const [itauClientId, setItauClientId] = useState('');
  const [itauClientSecret, setItauClientSecret] = useState('');
  const [itauPixChave, setItauPixChave] = useState('');
  const [itauApiKey, setItauApiKey] = useState('');
  const [itauApiUrl, setItauApiUrl] = useState('');
  const [itauAuthUrl, setItauAuthUrl] = useState('');

  useEffect(() => {
    if (itauSettings) {
      setItauClientId(itauSettings.client_id || '');
      setItauClientSecret(itauSettings.client_secret || '');
      setItauPixChave(itauSettings.pix_chave || '');
      setItauApiKey(itauSettings.api_key || '');
      setItauApiUrl(itauSettings.api_url || '');
      setItauAuthUrl(itauSettings.auth_url || '');
    }
  }, [itauSettings]);

  useEffect(() => {
    const checkItauConfig = async () => {
      setLoadingItauStatus(true);
      try {
        // Tenta invocar a função de auth para verificar se as credenciais estão lá
        // Esta função ainda depende das variáveis de ambiente para a verificação de status
        const { data, error } = await supabase.functions.invoke('itau-auth');
        if (error) {
          console.warn('Itaú Auth function error (likely missing env vars):', error.message);
          setItauConfigured(false);
        } else if (data?.access_token) {
          setItauConfigured(true);
        } else {
          setItauConfigured(false);
        }
      } catch (e) {
        console.error('Erro ao verificar configuração do Itaú:', e);
        setItauConfigured(false);
      } finally {
        setLoadingItauStatus(false);
      }
    };
    
    checkItauConfig();
  }, [saveItauSettings.isSuccess]); // Re-check status after saving settings

  const handleAddUnidade = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createUnidade.mutate({
      nome: formData.get('nome') as string,
      endereco: formData.get('endereco') as string || null,
      cidade: formData.get('cidade') as string || null,
      estado: formData.get('estado') as string || null,
      capacidade_cachorro: parseInt(formData.get('capacidade_cachorro') as string) || 10,
      capacidade_gato: parseInt(formData.get('capacidade_gato') as string) || 5,
    }, {
      onSuccess: () => setIsUnidadeDialogOpen(false)
    });
  };

  const handleAddServico = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createServico.mutate({
      nome: formData.get('nome') as string,
      preco: parseFloat(formData.get('preco') as string) || 0,
      icone: formData.get('icone') as string || '⭐', // Changed default icon to emoji
      ativo: true,
    }, {
      onSuccess: () => setIsServicoDialogOpen(false)
    });
  };

  const handleSaveItauSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveItauSettings.mutate({
      client_id: itauClientId,
      client_secret: itauClientSecret,
      pix_chave: itauPixChave,
      api_key: itauApiKey,
      api_url: itauApiUrl,
      auth_url: itauAuthUrl,
    });
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Configure unidades, preços e serviços
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Unidades */}
          <Card className="animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Building2 className="w-5 h-5 text-primary" />
                    Unidades
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Gerencie as unidades do hotel
                  </CardDescription>
                </div>
                <Dialog open={isUnidadeDialogOpen} onOpenChange={setIsUnidadeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nova Unidade</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddUnidade} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome da unidade</Label>
                        <Input id="nome" name="nome" required placeholder="Unidade Centro" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endereco">Endereço</Label>
                        <Input id="endereco" name="endereco" placeholder="Rua das Flores, 123" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cidade">Cidade</Label>
                          <Input id="cidade" name="cidade" placeholder="São Paulo" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado">Estado</Label>
                          <Input id="estado" name="estado" placeholder="SP" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="capacidade_cachorro">Vagas cachorros</Label>
                          <Input id="capacidade_cachorro" name="capacidade_cachorro" type="number" defaultValue="10" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="capacidade_gato">Vagas gatos</Label>
                          <Input id="capacidade_gato" name="capacidade_gato" type="number" defaultValue="5" />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsUnidadeDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={createUnidade.isPending}>
                          {createUnidade.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingUnidades ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : unidades.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma unidade cadastrada</p>
              ) : (
                unidades.map((unidade, index) => (
                  <div key={unidade.id} className="p-4 rounded-xl bg-muted/50 space-y-2" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-semibold text-foreground text-base">{unidade.nome}</h4>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteUnidade.mutate(unidade.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {(unidade.endereco || unidade.cidade || unidade.estado) && (
                      <p className="text-sm text-muted-foreground">
                        {unidade.endereco} {unidade.endereco && (unidade.cidade || unidade.estado) ? ', ' : ''}
                        {unidade.cidade} {unidade.cidade && unidade.estado ? ' - ' : ''}
                        {unidade.estado}
                      </p>
                    )}
                    <div className="flex gap-3 flex-wrap">
                      <Badge className="bg-coral-light text-primary text-xs">
                        🐶 {unidade.capacidade_cachorro} vagas
                      </Badge>
                      <Badge className="bg-mint-light text-secondary text-xs">
                        🐱 {unidade.capacidade_gato} vagas
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Serviços Adicionais */}
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <DollarSign className="w-5 h-5 text-secondary" />
                    Serviços Adicionais
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Configure serviços e preços
                  </CardDescription>
                </div>
                <Dialog open={isServicoDialogOpen} onOpenChange={setIsServicoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Novo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Novo Serviço</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddServico} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="servico_nome">Nome do serviço</Label>
                        <Input id="servico_nome" name="nome" required placeholder="Banho e Tosa" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="preco">Preço (R$)</Label>
                          <Input id="preco" name="preco" type="number" step="0.01" required placeholder="50.00" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="icone">Ícone (emoji)</Label>
                          <Input id="icone" name="icone" placeholder="🛁" />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsServicoDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={createServico.isPending}>
                          {createServico.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingServicos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : servicos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhum serviço cadastrado</p>
              ) : (
                servicos.map((servico, index) => (
                  <div key={servico.id} className="flex items-center gap-4 p-4 rounded-xl bg-honey-light/50" style={{ animationDelay: `${index * 50}ms` }}>
                    <span className="text-2xl">{servico.icone}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-base">{servico.nome}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-base">
                        R$ {Number(servico.preco).toFixed(2)}
                      </span>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Integração Itaú Pix */}
          <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Banknote className="w-5 h-5 text-mint" />
                Integração Itaú Pix
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Configure as credenciais para pagamentos Pix via Itaú.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingItauSettings || loadingItauStatus ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Carregando configurações...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                    {itauConfigured ? (
                      <CheckCircle className="w-6 h-6 text-secondary" />
                    ) : (
                      <XCircle className="w-6 h-6 text-destructive" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        Status da Conexão (Edge Functions): {itauConfigured ? 'Conectado' : 'Não Configurado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Este status reflete se as variáveis de ambiente estão configuradas nas suas Edge Functions.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveItauSettings} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="itau_client_id">Client ID</Label>
                      <Input id="itau_client_id" value={itauClientId} onChange={(e) => setItauClientId(e.target.value)} placeholder="Seu Client ID do Itaú" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="itau_client_secret">Client Secret</Label>
                      <Input id="itau_client_secret" type="password" value={itauClientSecret} onChange={(e) => setItauClientSecret(e.target.value)} placeholder="Seu Client Secret do Itaú" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="itau_pix_chave">Chave Pix</Label>
                      <Input id="itau_pix_chave" value={itauPixChave} onChange={(e) => setItauPixChave(e.target.value)} placeholder="Sua chave Pix (ex: email@exemplo.com)" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="itau_api_key">API Key</Label>
                      <Input id="itau_api_key" value={itauApiKey} onChange={(e) => setItauApiKey(e.target.value)} placeholder="Sua API Key do Itaú" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="itau_api_url">URL da API</Label>
                      <Input id="itau_api_url" value={itauApiUrl} onChange={(e) => setItauApiUrl(e.target.value)} placeholder="Ex: https://api.itau.com.br/pix/v2" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="itau_auth_url">URL de Autenticação</Label>
                      <Input id="itau_auth_url" value={itauAuthUrl} onChange={(e) => setItauAuthUrl(e.target.value)} placeholder="Ex: https://oauth.itau.com.br/identity/oauth/access-token" />
                    </div>
                    <Button type="submit" className="w-full" disabled={saveItauSettings.isPending}>
                      {saveItauSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar Configurações</>}
                    </Button>
                  </form>

                  <div className="space-y-2 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Importante: Variáveis de Ambiente
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Para máxima segurança, é **altamente recomendado** que você defina as credenciais do Itaú Pix como variáveis de ambiente (secrets) diretamente no seu projeto Supabase (em `Edge Functions &gt; Secrets`).
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      As Edge Functions tentarão ler as variáveis de ambiente primeiro. Se não as encontrarem, usarão as configurações salvas neste formulário.
                    </p>
                    <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-400 space-y-1">
                      <li>`ITAU_CLIENT_ID`</li>
                      <li>`ITAU_CLIENT_SECRET`</li>
                      <li>`ITAU_PIX_CHAVE`</li>
                      <li>`ITAU_API_KEY`</li>
                      <li>`ITAU_API_URL`</li>
                      <li>`ITAU_AUTH_URL`</li>
                    </ul>
                    <p className="text-xs text-blue-500 dark:text-blue-500 mt-2">
                      Após configurar as variáveis de ambiente, reinicie suas funções de Edge para que elas sejam carregadas.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
import { useState, useEffect } from 'react';
import { useChatwootConfig } from '@/hooks/useChatwootConfig';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, AlertTriangle, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';

export default function ChatwootEmbed() {
  const { data: config, isLoading, error } = useChatwootConfig();
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chatwootUrl = config?.chatwoot_base_url;
  const isConfigured = chatwootUrl && config?.chatwoot_account_id && config?.chatwoot_api_token;

  // Build the dashboard URL
  const dashboardUrl = chatwootUrl
    ? `${chatwootUrl.replace(/\/$/, '')}/app/accounts/${config?.chatwoot_account_id}/dashboard`
    : '';

  if (isLoading) {
    return (
      <Card className="h-[calc(100vh-260px)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando Chatwoot...</p>
        </div>
      </Card>
    );
  }

  if (error || !isConfigured) {
    return (
      <Card className="h-[calc(100vh-260px)] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold">Chatwoot n&atilde;o configurado</h3>
          <p className="text-muted-foreground text-sm">
            Para usar o painel do Chatwoot integrado, configure as credenciais em{' '}
            <strong>Configura&ccedil;&otilde;es &rarr; Chatwoot</strong>.
          </p>
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg text-left space-y-1">
            <p>Voc&ecirc; precisa de:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>URL do Chatwoot (ex: https://app.chatwoot.com)</li>
              <li>ID da conta</li>
              <li>Token de acesso da API</li>
            </ul>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-background p-2' : ''}>
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-card border rounded-t-xl px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground">
            Chatwoot Dashboard
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIframeKey(prev => prev + 1)}
            title="Recarregar"
          >
            <RefreshCw size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.open(dashboardUrl, '_blank')}
            title="Abrir em nova aba"
          >
            <ExternalLink size={14} />
          </Button>
        </div>
      </div>

      {/* Iframe */}
      <div className={`border border-t-0 rounded-b-xl overflow-hidden bg-white ${
        isFullscreen ? 'h-[calc(100vh-60px)]' : 'h-[calc(100vh-300px)]'
      }`}>
        <iframe
          key={iframeKey}
          src={dashboardUrl}
          className="w-full h-full border-0"
          title="Chatwoot Dashboard"
          allow="camera; microphone; clipboard-read; clipboard-write; notifications"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
        />
      </div>
    </div>
  );
}

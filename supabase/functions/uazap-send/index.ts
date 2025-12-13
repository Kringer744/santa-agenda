import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, apiUrl, instanceToken, ...payload } = await req.json();
    
    console.log(`[UAZAP] Action: ${action}`);
    console.log(`[UAZAP] API URL: ${apiUrl}`);

    if (!apiUrl || !instanceToken) {
      return new Response(
        JSON.stringify({ error: 'API URL e Token são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Testar conexão
    if (action === 'test') {
      console.log('[UAZAP] Testing connection...');
      const response = await fetch(`${apiUrl}/instance/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${instanceToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[UAZAP] Connection test failed:', errorText);
        return new Response(
          JSON.stringify({ success: false, error: 'Falha na conexão com a API UAZAP' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('[UAZAP] Connection successful:', data);
      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar menu interativo
    if (action === 'send-menu') {
      const { number, text, choices, listButton, footerText } = payload;
      
      console.log(`[UAZAP] Sending menu to: ${number}`);
      
      const response = await fetch(`${apiUrl}/send/interactive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${instanceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number,
          type: 'list',
          text,
          choices,
          listButton: listButton || 'Ver opções',
          footerText: footerText || '',
        }),
      });

      const data = await response.json();
      console.log('[UAZAP] Menu sent response:', data);
      
      return new Response(
        JSON.stringify({ success: response.ok, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar mensagem de texto simples
    if (action === 'send-text') {
      const { number, text } = payload;
      
      console.log(`[UAZAP] Sending text to: ${number}`);
      
      const response = await fetch(`${apiUrl}/send/text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${instanceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number, text }),
      });

      const data = await response.json();
      console.log('[UAZAP] Text sent response:', data);
      
      return new Response(
        JSON.stringify({ success: response.ok, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar campanha de disparo em massa
    if (action === 'create-campaign') {
      const { messages, delayMin, delayMax, info, scheduled_for } = payload;
      
      console.log(`[UAZAP] Creating campaign with ${messages?.length} messages`);
      
      const response = await fetch(`${apiUrl}/sender/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${instanceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delayMin: delayMin || 10,
          delayMax: delayMax || 30,
          info: info || 'Campanha de disparo',
          scheduled_for: scheduled_for || 1,
          messages,
        }),
      });

      const data = await response.json();
      console.log('[UAZAP] Campaign created response:', data);
      
      return new Response(
        JSON.stringify({ success: response.ok, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar botões interativos
    if (action === 'send-buttons') {
      const { number, text, choices, footerText } = payload;
      
      console.log(`[UAZAP] Sending buttons to: ${number}`);
      
      const response = await fetch(`${apiUrl}/send/interactive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${instanceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number,
          type: 'button',
          text,
          choices,
          footerText: footerText || '',
        }),
      });

      const data = await response.json();
      console.log('[UAZAP] Buttons sent response:', data);
      
      return new Response(
        JSON.stringify({ success: response.ok, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação não reconhecida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[UAZAP] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

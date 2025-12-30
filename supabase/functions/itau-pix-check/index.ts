import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { access_token, txid } = await req.json();

    // Try to get settings from environment variables first (most secure)
    let ITAU_API_URL = Deno.env.get("ITAU_API_URL") || "https://api.itau.com.br/pix/v2";
    let ITAU_API_KEY = Deno.env.get("ITAU_API_KEY");

    // If not found in environment variables, try to fetch from database
    if (!ITAU_API_KEY) {
      const { data: itauSettings, error: dbError } = await supabase
        .from('itau_settings')
        .select('api_key, api_url')
        .limit(1)
        .maybeSingle();

      if (dbError) {
        console.error("[ITAU_PIX_CHECK] Erro ao buscar configurações do banco de dados:", dbError);
      } else if (itauSettings) {
        ITAU_API_KEY = ITAU_API_KEY || itauSettings.api_key;
        ITAU_API_URL = ITAU_API_URL || itauSettings.api_url || ITAU_API_URL;
      }
    }

    if (!access_token || !txid) {
      return jsonResponse({ error: "access_token e txid são obrigatórios" }, 400);
    }
    if (!ITAU_API_KEY) {
      return jsonResponse({ error: "ITAU_API_KEY não configurada (env ou DB)" }, 400);
    }

    const response = await fetch(`${ITAU_API_URL}/cob/${txid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
        "x-itau-apikey": ITAU_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[ITAU_PIX_CHECK] Erro ao consultar cobrança Pix:", data);
      return jsonResponse({ error: data.detail || "Erro ao consultar cobrança Pix" }, response.status);
    }

    const isPaid = data.status === 'CONCLUIDA';

    return jsonResponse({ success: true, is_paid: isPaid, pix_status: data.status, full_data: data });
  } catch (error) {
    console.error("[ITAU_PIX_CHECK] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return jsonResponse({ error: errorMessage }, 500);
  }
});
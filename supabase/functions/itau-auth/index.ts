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
    // Always try to get settings from environment variables first (most secure)
    let ITAU_CLIENT_ID = Deno.env.get("ITAU_CLIENT_ID");
    let ITAU_CLIENT_SECRET = Deno.env.get("ITAU_CLIENT_SECRET");
    let ITAU_AUTH_URL = Deno.env.get("ITAU_AUTH_URL") || "https://oauth.itau.com.br/identity/oauth/access-token";

    // If Client ID or Secret are not found in environment variables, try to fetch from database
    // This fallback is kept for Client ID and Secret as they are managed by the UI
    if (!ITAU_CLIENT_ID || !ITAU_CLIENT_SECRET) {
      const { data: itauSettings, error: dbError } = await supabase
        .from('itau_settings')
        .select('client_id, client_secret') // Only select client_id and client_secret
        .limit(1)
        .maybeSingle();

      if (dbError) {
        console.error("[ITAU_AUTH] Erro ao buscar configurações do banco de dados:", dbError);
      } else if (itauSettings) {
        ITAU_CLIENT_ID = ITAU_CLIENT_ID || itauSettings.client_id;
        ITAU_CLIENT_SECRET = ITAU_CLIENT_SECRET || itauSettings.client_secret;
      }
    }

    if (!ITAU_CLIENT_ID || !ITAU_CLIENT_SECRET) {
      return jsonResponse({ error: "ITAU_CLIENT_ID e ITAU_CLIENT_SECRET são obrigatórios (env ou DB)" }, 400);
    }

    const authString = btoa(`${ITAU_CLIENT_ID}:${ITAU_CLIENT_SECRET}`);

    const response = await fetch(ITAU_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${authString}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "pix.read pix.write", // Ajuste os scopes conforme necessário
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[ITAU_AUTH] Erro ao obter token:", data);
      return jsonResponse({ error: data.error_description || "Erro ao obter token do Itaú" }, response.status);
    }

    return jsonResponse({ success: true, access_token: data.access_token, expires_in: data.expires_in });
  } catch (error) {
    console.error("[ITAU_AUTH] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return jsonResponse({ error: errorMessage }, 500);
  }
});
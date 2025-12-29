import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

  try {
    const ITAU_CLIENT_ID = Deno.env.get("ITAU_CLIENT_ID");
    const ITAU_CLIENT_SECRET = Deno.env.get("ITAU_CLIENT_SECRET");
    const ITAU_AUTH_URL = Deno.env.get("ITAU_AUTH_URL") || "https://oauth.itau.com.br/identity/oauth/access-token";

    if (!ITAU_CLIENT_ID || !ITAU_CLIENT_SECRET) {
      return jsonResponse({ error: "ITAU_CLIENT_ID e ITAU_CLIENT_SECRET são obrigatórios" }, 400);
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
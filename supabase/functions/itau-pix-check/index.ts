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
    const { access_token, txid } = await req.json();

    const ITAU_API_URL = Deno.env.get("ITAU_API_URL") || "https://api.itau.com.br/pix/v2";

    if (!access_token || !txid) {
      return jsonResponse({ error: "access_token e txid são obrigatórios" }, 400);
    }

    const response = await fetch(`${ITAU_API_URL}/cob/${txid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[ITAU_PIX_CHECK] Erro ao consultar cobrança Pix:", data);
      return jsonResponse({ error: data.detail || "Erro ao consultar cobrança Pix" }, response.status);
    }

    // O status da cobrança pode ser 'ATIVA', 'CONCLUIDA', 'REMOVIDA_PELO_USUARIO_RECEBEDOR', 'REMOVIDA_PELO_PSP'
    // Para verificar o pagamento, precisamos ver se há transações Pix associadas.
    // A estrutura de resposta pode variar, mas geralmente 'status' indica o estado da cobrança.
    // Se houver um campo 'pix' na resposta, ele conteria os pagamentos recebidos.
    const isPaid = data.status === 'CONCLUIDA'; // Exemplo: assumindo que 'CONCLUIDA' significa pago

    return jsonResponse({ success: true, is_paid: isPaid, pix_status: data.status, full_data: data });
  } catch (error) {
    console.error("[ITAU_PIX_CHECK] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return jsonResponse({ error: errorMessage }, 500);
  }
});
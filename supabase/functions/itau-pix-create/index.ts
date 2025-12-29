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
    const { access_token, valor, txid } = await req.json();

    const ITAU_API_URL = Deno.env.get("ITAU_API_URL") || "https://api.itau.com.br/pix/v2";
    const ITAU_PIX_CHAVE = Deno.env.get("ITAU_PIX_CHAVE");

    if (!access_token || !valor || !txid) {
      return jsonResponse({ error: "access_token, valor e txid são obrigatórios" }, 400);
    }
    if (!ITAU_PIX_CHAVE) {
      return jsonResponse({ error: "ITAU_PIX_CHAVE não configurada" }, 400);
    }

    const pixPayload = {
      calendario: {
        expiracao: 3600, // 1 hora para expirar
      },
      valor: {
        original: valor.toFixed(2),
      },
      chave: ITAU_PIX_CHAVE,
      solicitacaoPagador: "Reserva PetHotel",
    };

    const response = await fetch(`${ITAU_API_URL}/cob/${txid}`, {
      method: "PUT", // Ou POST para criar uma nova cobrança sem txid pré-definido
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
        "x-itau-correlation-id": txid, // Usar txid como correlation ID
      },
      body: JSON.stringify(pixPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[ITAU_PIX_CREATE] Erro ao criar cobrança Pix:", data);
      return jsonResponse({ error: data.detail || "Erro ao criar cobrança Pix" }, response.status);
    }

    // A resposta do Itaú já deve conter o pixCopiaECola e a imagem_base64 (se solicitada)
    return jsonResponse({ success: true, pix_data: data });
  } catch (error) {
    console.error("[ITAU_PIX_CREATE] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return jsonResponse({ error: errorMessage }, 500);
  }
});
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
    const { access_token, valor, tutor_cpf, tutor_nome, solicitacaoPagador } = await req.json();

    const ITAU_API_URL = Deno.env.get("ITAU_API_URL") || "https://api.itau.com.br/pix/v2";
    const ITAU_PIX_CHAVE = Deno.env.get("ITAU_PIX_CHAVE");
    const ITAU_API_KEY = Deno.env.get("ITAU_API_KEY");

    if (!access_token || !valor || !tutor_cpf || !tutor_nome) {
      return jsonResponse({ error: "access_token, valor, tutor_cpf e tutor_nome são obrigatórios" }, 400);
    }
    if (!ITAU_PIX_CHAVE) {
      return jsonResponse({ error: "ITAU_PIX_CHAVE não configurada" }, 400);
    }
    if (!ITAU_API_KEY) {
      return jsonResponse({ error: "ITAU_API_KEY não configurada" }, 400);
    }

    const pixPayload = {
      calendario: {
        expiracao: 3600, // 1 hora para expirar
      },
      devedor: {
        cpf: tutor_cpf,
        nome: tutor_nome,
      },
      valor: {
        original: valor.toFixed(2),
      },
      chave: ITAU_PIX_CHAVE,
      solicitacaoPagador: solicitacaoPagador || "Reserva PetHotel",
    };

    // STEP 2: CREATE PIX CHARGE
    const createChargeResponse = await fetch(`${ITAU_API_URL}/cob`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
        "x-itau-apikey": ITAU_API_KEY,
      },
      body: JSON.stringify(pixPayload),
    });

    const createChargeData = await createChargeResponse.json();

    if (!createChargeResponse.ok) {
      console.error("[ITAU_PIX_CREATE] Erro ao criar cobrança Pix:", createChargeData);
      return jsonResponse({ error: createChargeData.detail || "Erro ao criar cobrança Pix" }, createChargeResponse.status);
    }

    const { txid, pixCopiaECola, loc } = createChargeData;

    if (!loc?.id) {
        console.error("[ITAU_PIX_CREATE] loc.id não encontrado na resposta da criação da cobrança:", createChargeData);
        return jsonResponse({ error: "ID da localização do QR Code não encontrado" }, 500);
    }

    // STEP 3: GENERATE QR CODE IMAGE
    const getQrCodeResponse = await fetch(`${ITAU_API_URL}/loc/${loc.id}/qrcode`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${access_token}`,
            "x-itau-apikey": ITAU_API_KEY,
        },
    });

    const getQrCodeData = await getQrCodeResponse.json();

    if (!getQrCodeResponse.ok) {
        console.error("[ITAU_PIX_CREATE] Erro ao gerar QR Code:", getQrCodeData);
        return jsonResponse({ error: getQrCodeData.detail || "Erro ao gerar QR Code" }, getQrCodeResponse.status);
    }

    const { imagemQrcode } = getQrCodeData;

    return jsonResponse({ success: true, pix_data: { txid, pixCopiaECola, qrCodeBase64: imagemQrcode } });
  } catch (error) {
    console.error("[ITAU_PIX_CREATE] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return jsonResponse({ error: errorMessage }, 500);
  }
});
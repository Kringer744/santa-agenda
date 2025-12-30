// @ts-ignore: Deno environment
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { access_token, valor, paciente_cpf, paciente_nome, solicitacaoPagador } = await req.json();

    const ITAU_API_URL = "https://api.itau.com.br/pix/v2";
    const ITAU_PIX_CHAVE = "24164831880";
    const ITAU_API_KEY = "sua-api-key-aqui";

    if (!access_token || !valor || !paciente_cpf || !paciente_nome) {
      return jsonResponse({ error: "Parâmetros obrigatórios ausentes" }, 400);
    }

    const pixPayload = {
      calendario: { expiracao: 3600 },
      devedor: { cpf: paciente_cpf, nome: paciente_nome },
      valor: { original: valor.toFixed(2) },
      chave: ITAU_PIX_CHAVE,
      solicitacaoPagador: solicitacaoPagador || "Consulta Odontológica",
    };

    const createResp = await fetch(`${ITAU_API_URL}/cob`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
        "x-itau-apikey": ITAU_API_KEY,
      },
      body: JSON.stringify(pixPayload),
    });

    const createData = await createResp.json();
    if (!createResp.ok) return jsonResponse({ error: createData.detail || "Erro na criação" }, createResp.status);

    const { loc } = createData;
    const qrResp = await fetch(`${ITAU_API_URL}/loc/${loc.id}/qrcode`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "x-itau-apikey": ITAU_API_KEY,
      },
    });

    const qrData = await qrResp.json();
    return jsonResponse({
      success: true,
      pix_data: {
        txid: createData.txid,
        pixCopiaECola: createData.pixCopiaECola,
        qrCodeBase64: qrData.imagemQrcode
      }
    });
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
});
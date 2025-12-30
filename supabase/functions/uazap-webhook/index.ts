// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, token",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) cleaned = '55' + cleaned;
  return cleaned;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    // @ts-ignore: Deno namespace
    Deno.env.get("SUPABASE_URL") ?? "",
    // @ts-ignore: Deno namespace
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // IMPORTANTE: Mudar para a URL real do seu app publicado depois
  const APP_URL = "https://preview-ktepifvhpdgexdgvhxpq.lovable.app"; 

  try {
    const body = await req.json();
    const message = body?.message ?? {};
    if (message?.fromMe) return jsonResponse({ ok: true });

    const rawFrom = body?.chat?.phone ?? message?.sender ?? "";
    const fromNumber = formatPhoneNumber(rawFrom);

    const receivedText = (message?.text ?? "").toLowerCase().trim();

    // Se o cliente responder "1" ou escolher a opção de agendar
    if (receivedText === "1" || receivedText.includes("agendar")) {
      const { data: paciente } = await supabase
        .from('pacientes')
        .select('id, nome')
        .eq('telefone', fromNumber)
        .maybeSingle();

      const { data: config } = await supabase.from('whatsapp_config').select('*').single();

      let link = `${APP_URL}/client-appointment`;
      let text = `Olá! Para agendar sua consulta na DentalClinic, acesse o link abaixo:\n\n${link}\n\nSelecione o dentista e o melhor horário para você.`;

      if (paciente) {
        link += `?paciente_id=${paciente.id}`;
        text = `Olá ${paciente.nome}! Que bom te ver novamente. Para agendar sua nova consulta, use este link exclusivo:\n\n${link}`;
      }

      await fetch(`${config.api_url}/send/text`, {
        method: "POST",
        headers: { token: config.instance_token, "Content-Type": "application/json" },
        body: JSON.stringify({ number: fromNumber, text }),
      });

      return jsonResponse({ ok: true, sent: true });
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return jsonResponse({ ok: false, error: errorMessage }, 500);
  }
});
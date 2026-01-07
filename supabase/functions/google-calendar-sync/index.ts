// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno environment
import { google } from "https://esm.sh/googleapis@105.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req: Request) => {
  // 1. Tratamento imediato de OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("[google-calendar-sync] Recebendo requisição...");

  try {
    // Credenciais (Configuradas diretamente)
    const GOOGLE_CLIENT_ID = "217643829089-j6pr08u3u3v0oeqt74k742cp5h2f8leu.apps.googleusercontent.com";
    const GOOGLE_CLIENT_SECRET = "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";
    const GOOGLE_REFRESH_TOKEN = "1//04i5svmmxX5m8CgYIARAAGAQSNwF-L9IrIIIVYq-HaY45Id42ufMtBcKbnyxwOhiqis8BepDDtkQ-hhRZuOVbIjXsC-Cx8WxpXyo";

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    const body = await req.json().catch(() => ({}));
    const { action, eventData, calendarId } = body;

    if (!calendarId) {
      console.error("[google-calendar-sync] Erro: calendarId ausente.");
      return new Response(JSON.stringify({ error: "calendarId é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[google-calendar-sync] Ação: ${action} | Calendário: ${calendarId}`);

    let result;
    switch (action) {
      case "createEvent":
        const createRes = await calendar.events.insert({ calendarId, requestBody: eventData });
        result = { success: true, event: createRes.data };
        break;
      
      case "updateEvent":
        if (!eventData?.id) throw new Error("ID do evento é necessário para atualização.");
        const updateRes = await calendar.events.update({ calendarId, eventId: eventData.id, requestBody: eventData });
        result = { success: true, event: updateRes.data };
        break;
      
      case "deleteEvent":
        if (!eventData?.id) throw new Error("ID do evento é necessário para exclusão.");
        await calendar.events.delete({ calendarId, eventId: eventData.id });
        result = { success: true };
        break;
      
      default:
        throw new Error(`Ação '${action}' não suportada.`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("[google-calendar-sync] Erro crítico:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
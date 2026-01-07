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
    // Credenciais (Configuradas diretamente) - ATUALIZADAS
    const GOOGLE_CLIENT_ID = "217643829089-rv6qdig8von36faa2horjnpn3b9o68ip.apps.googleusercontent.com";
    const GOOGLE_CLIENT_SECRET = "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";
    const GOOGLE_REFRESH_TOKEN = "1//04ZqEaumTtZ8PCgYIARAAGAQSNwF-L9IrGL_ZAZ05o1NduM2dmXAwq2P6LlvWmZkEwq6wTK0ZSD1XYlH135uwJSSYbe3aaVy5iwI";

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
// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno environment
import { google } from "https://esm.sh/googleapis@144.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 
      ...corsHeaders, 
      "Content-Type": "application/json" 
    },
  });
}

serve(async (req: Request) => {
  // 1. TRATAMENTO DE OPTIONS (PREFLIGHT) - USANDO 200 OK
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // Credenciais (Configuradas diretamente para facilitar a integração)
    const GOOGLE_CLIENT_ID = "217643829089-j6pr08u3u3v0oeqt74k742cp5h2f8leu.apps.googleusercontent.com";
    const GOOGLE_CLIENT_SECRET = "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";
    const GOOGLE_REFRESH_TOKEN = "1//04i5svmmxX5m8CgYIARAAGAQSNwF-L9IrIIIVYq-HaY45Id42ufMtBcKbnyxwOhiqis8BepDDtkQ-hhRZuOVbIjXsC-Cx8WxpXyo";

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    const payload = await req.json().catch(() => ({}));
    const { action, eventData, calendarId } = payload;

    if (!calendarId) {
      return jsonResponse({ error: "O e-mail do dentista é obrigatório." }, 400);
    }

    console.log(`[google-calendar-sync] Executando: ${action} para ${calendarId}`);

    switch (action) {
      case "createEvent": {
        const response = await calendar.events.insert({ 
          calendarId: calendarId, 
          requestBody: eventData 
        });
        return jsonResponse({ success: true, event: response.data });
      }
      
      case "updateEvent": {
        if (!eventData?.id) return jsonResponse({ error: "ID do evento ausente." }, 400);
        const response = await calendar.events.update({ 
          calendarId: calendarId, 
          eventId: eventData.id, 
          requestBody: eventData 
        });
        return jsonResponse({ success: true, event: response.data });
      }
      
      case "deleteEvent": {
        if (!eventData?.id) return jsonResponse({ error: "ID do evento ausente." }, 400);
        await calendar.events.delete({ 
          calendarId: calendarId, 
          eventId: eventData.id 
        });
        return jsonResponse({ success: true });
      }
      
      default:
        return jsonResponse({ error: `Ação '${action}' não reconhecida.` }, 400);
    }
  } catch (error: any) {
    console.error("[google-calendar-sync] Erro:", error.message);
    const detail = error.response?.data?.error?.message || error.message;
    return jsonResponse({ error: detail }, 500);
  }
});
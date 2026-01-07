// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno environment
import { google } from "https://esm.sh/googleapis@144.0.0";

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
  // Tratamento explícito de CORS (Preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // @ts-ignore: Deno namespace
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    // @ts-ignore: Deno namespace
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    // @ts-ignore: Deno namespace
    const GOOGLE_REFRESH_TOKEN = Deno.env.get("GOOGLE_REFRESH_TOKEN");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      console.error("[google-calendar-sync] Erro: Faltam segredos no Supabase.");
      return jsonResponse({ error: "Configuração incompleta: Verifique os Secrets GOOGLE_CLIENT_ID, SECRET e REFRESH_TOKEN no painel do Supabase." }, 500);
    }

    // Usando a autenticação diretamente da biblioteca googleapis para evitar conflitos de versão
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    // Validar corpo da requisição
    const payload = await req.json().catch(() => ({}));
    const { action, eventData, calendarId } = payload;

    if (!calendarId) {
      console.error("[google-calendar-sync] Erro: calendarId não informado.");
      return jsonResponse({ error: "O ID do calendário (e-mail do dentista) é obrigatório." }, 400);
    }

    console.log(`[google-calendar-sync] Executando: ${action} para ${calendarId}`);

    switch (action) {
      case "createEvent": {
        console.log("[google-calendar-sync] Criando evento...");
        const response = await calendar.events.insert({ 
          calendarId: calendarId, 
          requestBody: eventData 
        });
        return jsonResponse({ success: true, event: response.data });
      }
      
      case "updateEvent": {
        if (!eventData?.id) return jsonResponse({ error: "ID do evento é necessário para atualização." }, 400);
        const response = await calendar.events.update({ 
          calendarId: calendarId, 
          eventId: eventData.id, 
          requestBody: eventData 
        });
        return jsonResponse({ success: true, event: response.data });
      }
      
      case "deleteEvent": {
        if (!eventData?.id) return jsonResponse({ error: "ID do evento é necessário para exclusão." }, 400);
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
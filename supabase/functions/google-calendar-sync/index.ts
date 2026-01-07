// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno environment
import { google } from "https://esm.sh/googleapis@137.0.0";
// @ts-ignore: Deno environment
import { OAuth2Client } from "https://esm.sh/google-auth-library@9.11.0";

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
    // @ts-ignore: Deno namespace
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    // @ts-ignore: Deno namespace
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    // @ts-ignore: Deno namespace
    const GOOGLE_REFRESH_TOKEN = Deno.env.get("GOOGLE_REFRESH_TOKEN");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      console.error("[google-calendar-sync] Credenciais OAuth não encontradas no ambiente.");
      return jsonResponse({ error: "Credenciais do Google Calendar não configuradas no servidor (Secrets)." }, 500);
    }

    const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, "postmessage");
    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const { action, eventData, calendarId } = await req.json();

    if (!calendarId) {
      return jsonResponse({ error: "ID do calendário não fornecido." }, 400);
    }

    console.log(`[google-calendar-sync] Executando ação: ${action} para calendário: ${calendarId}`);

    switch (action) {
      case "createEvent": {
        const response = await calendar.events.insert({ calendarId, requestBody: eventData });
        return jsonResponse({ success: true, event: response.data });
      }
      case "updateEvent": {
        const response = await calendar.events.update({ calendarId, eventId: eventData.id, requestBody: eventData });
        return jsonResponse({ success: true, event: response.data });
      }
      case "deleteEvent": {
        await calendar.events.delete({ calendarId, eventId: eventData.id });
        return jsonResponse({ success: true });
      }
      default:
        return jsonResponse({ error: "Ação inválida" }, 400);
    }
  } catch (error: any) {
    console.error("[google-calendar-sync] Erro:", error.message);
    return jsonResponse({ error: error.message || "Erro interno na função de calendário" }, 500);
  }
});
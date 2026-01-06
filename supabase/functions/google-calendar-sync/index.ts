// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    // @ts-ignore: Deno namespace
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY"); // A chave de API fornecida pelo usuário

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      console.error("[GOOGLE_CALENDAR_SYNC] Credenciais OAuth do Google não configuradas.");
      return jsonResponse({ error: "Credenciais OAuth do Google não configuradas." }, 500);
    }

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      "postmessage" // ou uma URL de redirecionamento válida se você estiver fazendo o fluxo completo
    );

    oauth2Client.setCredentials({
      refresh_token: GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const { action, eventData, calendarId: targetCalendarId } = await req.json();

    if (!targetCalendarId) {
      console.error("[GOOGLE_CALENDAR_SYNC] ID do calendário Google não fornecido.");
      return jsonResponse({ error: "ID do calendário Google não fornecido." }, 400);
    }

    switch (action) {
      case "createEvent": {
        console.log("[GOOGLE_CALENDAR_SYNC] Creating event:", eventData);
        const response = await calendar.events.insert({
          calendarId: targetCalendarId,
          requestBody: eventData,
        });
        return jsonResponse({ success: true, event: response.data });
      }
      case "updateEvent": {
        console.log("[GOOGLE_CALENDAR_SYNC] Updating event:", eventData.id);
        const response = await calendar.events.update({
          calendarId: targetCalendarId,
          eventId: eventData.id,
          requestBody: eventData,
        });
        return jsonResponse({ success: true, event: response.data });
      }
      case "deleteEvent": {
        console.log("[GOOGLE_CALENDAR_SYNC] Deleting event:", eventData.id);
        await calendar.events.delete({
          calendarId: targetCalendarId,
          eventId: eventData.id,
        });
        return jsonResponse({ success: true });
      }
      case "listEvents": {
        console.log("[GOOGLE_CALENDAR_SYNC] Listing events for calendar:", targetCalendarId);
        const response = await calendar.events.list({
          calendarId: targetCalendarId,
          timeMin: (new Date()).toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime',
        });
        return jsonResponse({ success: true, events: response.data.items });
      }
      default:
        return jsonResponse({ error: "Ação não reconhecida" }, 400);
    }
  } catch (error: any) {
    console.error("[GOOGLE_CALENDAR_SYNC] Erro na função Edge:", error.message, error.stack);
    return jsonResponse({ error: error.message || "Erro interno do servidor" }, 500);
  }
});
// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno environment
import { google } from "https://esm.sh/googleapis@144.0.0";
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
      console.error("[google-calendar-sync] Erro: Faltam segredos (Secrets) no Supabase.");
      return jsonResponse({ error: "Configuração incompleta no servidor. Verifique os Secrets GOOGLE_CLIENT_ID, SECRET e REFRESH_TOKEN." }, 500);
    }

    const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

    // Tenta atualizar o access_token para validar a conexão
    try {
      await oauth2Client.getAccessToken();
      console.log("[google-calendar-sync] Token OAuth validado com sucesso.");
    } catch (authErr: any) {
      console.error("[google-calendar-sync] Erro de Autenticação OAuth:", authErr.message);
      return jsonResponse({ error: "Falha na autenticação com o Google. O Refresh Token pode estar expirado ou inválido." }, 401);
    }

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const { action, eventData, calendarId } = await req.json();

    if (!calendarId) {
      return jsonResponse({ error: "O ID do calendário (e-mail do dentista) não foi fornecido." }, 400);
    }

    console.log(`[google-calendar-sync] Ação: ${action} | Calendário: ${calendarId}`);

    switch (action) {
      case "createEvent": {
        console.log("[google-calendar-sync] Criando evento:", JSON.stringify(eventData));
        const response = await calendar.events.insert({ 
          calendarId: calendarId, 
          requestBody: eventData 
        });
        console.log("[google-calendar-sync] Evento criado com ID:", response.data.id);
        return jsonResponse({ success: true, event: response.data });
      }
      
      case "updateEvent": {
        if (!eventData.id) return jsonResponse({ error: "ID do evento é necessário para atualização." }, 400);
        const response = await calendar.events.update({ 
          calendarId: calendarId, 
          eventId: eventData.id, 
          requestBody: eventData 
        });
        return jsonResponse({ success: true, event: response.data });
      }
      
      case "deleteEvent": {
        if (!eventData.id) return jsonResponse({ error: "ID do evento é necessário para exclusão." }, 400);
        await calendar.events.delete({ 
          calendarId: calendarId, 
          eventId: eventData.id 
        });
        return jsonResponse({ success: true });
      }
      
      default:
        return jsonResponse({ error: "Ação não reconhecida." }, 400);
    }
  } catch (error: any) {
    console.error("[google-calendar-sync] Erro Crítico:", error.message);
    // Retorna o erro detalhado do Google se disponível
    const detail = error.response?.data?.error?.message || error.message;
    return jsonResponse({ error: detail }, 500);
  }
});
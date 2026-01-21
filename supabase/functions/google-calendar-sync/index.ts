// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("[google-calendar-sync] Nova requisição recebida.");

  try {
    // NOVAS CREDENCIAIS FORNECIDAS PELO USUÁRIO
    const GOOGLE_CLIENT_ID = "1076641595234-6i5uj3js5gmvp9kekn6fmtckqi6rtdva.apps.googleusercontent.com";
    const GOOGLE_CLIENT_SECRET = "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";
    // IMPORTANTE: Substitua a string abaixo pelo NOVO refresh token gerado no OAuth 2.0 Playground
    const GOOGLE_REFRESH_TOKEN = "COLOQUE_AQUI_O_NOVO_REFRESH_TOKEN"; // <--- SUBSTITUA ESTA LINHA

    const body = await req.json().catch(() => ({}));
    const { action, eventData, calendarId } = body;

    if (!calendarId) {
      console.error("[google-calendar-sync] Erro: calendarId não fornecido.");
      return jsonResponse({ error: "calendarId é obrigatório." }, 400);
    }

    console.log(`[google-calendar-sync] Executando ação: ${action} no calendário: ${calendarId}`);

    // Função para renovar o access token usando fetch puro
    async function refreshAccessToken(): Promise<string | null> {
      try {
        const params = new URLSearchParams();
        params.append('client_id', GOOGLE_CLIENT_ID);
        params.append('client_secret', GOOGLE_CLIENT_SECRET);
        params.append('refresh_token', GOOGLE_REFRESH_TOKEN);
        params.append('grant_type', 'refresh_token');

        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.error === 'invalid_grant') {
            console.error("[google-calendar-sync] Erro crítico: Refresh token inválido ou expirado. É necessário reautorizar o acesso.", data);
            throw new Error("Refresh token inválido ou expirado. Por favor, reautorize o acesso ao Google Calendar.");
          }
          console.error("[google-calendar-sync] Erro ao renovar token:", data);
          throw new Error(`OAuth Error: ${data.error_description || JSON.stringify(data)}`);
        }

        console.log("[google-calendar-sync] Access token renovado com sucesso.");
        return data.access_token;
      } catch (error) {
        console.error("[google-calendar-sync] Erro na função refreshAccessToken:", error);
        throw error; // Re-lança o erro para ser capturado pelo bloco try/catch principal
      }
    }

    // Obter um access token válido
    const accessToken = await refreshAccessToken();
    if (!accessToken) {
      return jsonResponse({ error: "Falha ao obter access token. Verifique suas credenciais e o refresh token." }, 401);
    }

    let result;

    switch (action) {
      case "createEvent":
        console.log("[google-calendar-sync] Criando evento...", eventData);
        const createRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        const createData = await createRes.json();

        if (!createRes.ok) {
          console.error("[google-calendar-sync] Erro ao criar evento:", createData);
          return jsonResponse({ error: createData.error?.message || "Erro ao criar evento" }, createRes.status);
        }

        result = { success: true, event: createData };
        console.log("[google-calendar-sync] Evento criado com sucesso:", createData.id);
        break;

      case "updateEvent":
        if (!eventData?.id) {
          throw new Error("ID do evento ausente para atualização.");
        }
        console.log(`[google-calendar-sync] Atualizando evento ${eventData.id}...`);
        const updateRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventData.id)}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        const updateData = await updateRes.json();

        if (!updateRes.ok) {
          console.error("[google-calendar-sync] Erro ao atualizar evento:", updateData);
          return jsonResponse({ error: updateData.error?.message || "Erro ao atualizar evento" }, updateRes.status);
        }

        result = { success: true, event: updateData };
        console.log("[google-calendar-sync] Evento atualizado com sucesso.");
        break;

      case "deleteEvent":
        if (!eventData?.id) {
          throw new Error("ID do evento ausente para exclusão.");
        }
        console.log(`[google-calendar-sync] Excluindo evento ${eventData.id}...`);
        const deleteRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventData.id)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!deleteRes.ok) {
          const errorData = await deleteRes.json();
          console.error("[google-calendar-sync] Erro ao excluir evento:", errorData);
          return jsonResponse({ error: errorData.error?.message || "Erro ao excluir evento" }, deleteRes.status);
        }

        result = { success: true };
        console.log("[google-calendar-sync] Evento excluído com sucesso.");
        break;

      default:
        throw new Error(`Ação '${action}' não reconhecida.`);
    }

    return jsonResponse(result, 200);

  } catch (error: any) {
    console.error("[google-calendar-sync] Erro durante a execução:", error.message);
    return jsonResponse({ error: error.message }, 500);
  }
});
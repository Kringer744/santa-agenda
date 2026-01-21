// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("[google-calendar-sync] Nova requisição recebida.");

  try {
    // SUAS NOVAS CREDENCIAIS FORNECIDAS
    const GOOGLE_CLIENT_ID = "1076641595234-bkhuehgagg5dmj3hl8rsip13aoo0dksh.apps.googleusercontent.com";
    const GOOGLE_CLIENT_SECRET = "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";
    const GOOGLE_REFRESH_TOKEN = "COLOQUE_AQUI_O_NOVO_REFRESH_TOKEN";

    const body = await req.json().catch(() => ({}));
    const { action, eventData, calendarId } = body;

    if (!calendarId) {
      console.error("[google-calendar-sync] Erro: calendarId não fornecido.");
      return new Response(JSON.stringify({ error: "calendarId é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[google-calendar-sync] Executando ação: ${action} no calendário: ${calendarId}`);

    // Função para renovar o access token
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
          if (data.error && data.error.code === 400 && data.error.status === 'INVALID_ARGUMENT') {
            console.error("[google-calendar-sync] Refresh token inválido ou expirado:", data.error);
            return null;
          }
          throw new Error(`OAuth Error: ${JSON.stringify(data)}`);
        }

        return data.access_token;
      } catch (error) {
        console.error("[google-calendar-sync] Erro ao renovar token:", error);
        return null;
      }
    }

    // Obter um access token válido
    const accessToken = await refreshAccessToken();
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Falha ao obter access token. Verifique suas credenciais." }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
          return new Response(JSON.stringify({ error: createData.error || "Erro ao criar evento" }), {
            status: createRes.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
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
          return new Response(JSON.stringify({ error: updateData.error || "Erro ao atualizar evento" }), {
            status: updateRes.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
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
          return new Response(JSON.stringify({ error: errorData.error || "Erro ao excluir evento" }), {
            status: deleteRes.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        result = { success: true };
        console.log("[google-calendar-sync] Evento excluído com sucesso.");
        break;

      default:
        throw new Error(`Ação '${action}' não reconhecida.`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("[google-calendar-sync] Erro durante a execução:", error.message);
    if (error.message.includes('invalid_grant')) {
      console.error("[google-calendar-sync] Erro crítico: O Refresh Token expirou ou é inválido para estas credenciais.");
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
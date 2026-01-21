import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { refreshAccessToken, createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from '@/lib/googleOAuth';

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
}

interface GoogleCalendarSyncPayload {
  action: 'createEvent' | 'updateEvent' | 'deleteEvent' | 'listEvents';
  eventData?: GoogleCalendarEvent | { id: string };
  calendarId: string;
}

export function useGoogleCalendarSync() {
  return useMutation({
    mutationFn: async (payload: GoogleCalendarSyncPayload) => {
      try {
        // Carregar credenciais do Supabase (ou de onde estiverem armazenadas)
        // Em um sistema real, você teria uma tabela de configurações
        const GOOGLE_CLIENT_ID = "1076641595234-bkhuehgagg5dmj3hl8rsip13aoo0dksh.apps.googleusercontent.com";
        const GOOGLE_CLIENT_SECRET = "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";
        const GOOGLE_REFRESH_TOKEN = "COLOQUE_AQUI_O_NOVO_REFRESH_TOKEN";

        // Obter um access token válido
        const accessToken = await refreshAccessToken(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN);
        if (!accessToken) {
          throw new Error("Não foi possível obter um access token válido. Verifique suas credenciais.");
        }

        // Executar a ação solicitada
        switch (payload.action) {
          case "createEvent":
            if (!payload.eventData) throw new Error("eventData é obrigatório para criar evento.");
            const createdEvent = await createGoogleCalendarEvent(accessToken, payload.calendarId, payload.eventData);
            if (!createdEvent) throw new Error("Falha ao criar evento no Google Calendar.");
            return { success: true, event: createdEvent };

          case "updateEvent":
            if (!payload.eventData?.id) throw new Error("ID do evento ausente para atualização.");
            const updatedEvent = await updateGoogleCalendarEvent(accessToken, payload.calendarId, payload.eventData.id, payload.eventData);
            if (!updatedEvent) throw new Error("Falha ao atualizar evento no Google Calendar.");
            return { success: true, event: updatedEvent };

          case "deleteEvent":
            if (!payload.eventData?.id) throw new Error("ID do evento ausente para exclusão.");
            const deleted = await deleteGoogleCalendarEvent(accessToken, payload.calendarId, payload.eventData.id);
            if (!deleted) throw new Error("Falha ao excluir evento no Google Calendar.");
            return { success: true };

          default:
            throw new Error(`Ação '${payload.action}' não reconhecida.`);
        }
      } catch (err: any) {
        // Se for um erro de rede/CORS, o invoke pode falhar silenciosamente
        console.error("Erro na sincronização do Google Calendar:", err);
        throw err;
      }
    },
    onError: (error: Error) => {
      console.error("Falha na sincronização do Google Calendar:", error);
      toast.error(`Erro: ${error.message}`);
    },
  });
}
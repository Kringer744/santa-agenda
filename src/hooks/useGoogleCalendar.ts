import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
        const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
          body: payload,
        });

        if (error) {
          console.error("Erro ao invocar função Edge:", error);
          throw new Error(error.message || "Falha na comunicação com o servidor.");
        }

        if (data?.error) {
          console.error("Erro retornado pela função Edge:", data.error);
          throw new Error(data.error);
        }

        return data;
      } catch (err: any) {
        // Se for um erro de rede/CORS, o invoke pode falhar silenciosamente
        console.error("Erro na mutação de sincronização:", err);
        throw err;
      }
    },
    onError: (error: Error) => {
      console.error("Falha na sincronização do Google Calendar:", error);
      toast.error(`Erro: ${error.message}`);
    },
  });
}
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
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: payload,
      });

      if (error) {
        console.error("Erro ao sincronizar com Google Calendar (Supabase invoke error):", error);
        // Garante que a mensagem de erro seja uma string, ou usa uma mensagem genérica
        const errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error);
        throw new Error(errorMessage);
      }
      if (data?.error) {
        console.error("Erro na função Edge do Google Calendar (Edge function error):", data.error);
        // Garante que a mensagem de erro seja uma string, ou usa uma mensagem genérica
        const errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        throw new Error(errorMessage);
      }
      return data;
    },
    onError: (error: Error) => {
      // A mensagem de erro aqui agora deve ser sempre uma string
      toast.error(`Erro ao sincronizar com Google Calendar: ${error.message}`);
    },
  });
}
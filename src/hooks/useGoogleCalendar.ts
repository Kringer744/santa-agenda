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
        console.error("Erro ao sincronizar com Google Calendar:", error);
        throw new Error(data?.error || error.message);
      }
      if (data?.error) {
        console.error("Erro na função Edge do Google Calendar:", data.error);
        throw new Error(data.error);
      }
      return data;
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sincronizar com Google Calendar: ${error.message}`);
    },
  });
}
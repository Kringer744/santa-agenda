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

// Definindo tipos mais específicos para cada ação
interface CreateEventPayload {
  action: 'createEvent';
  calendarId: string;
  eventData: Omit<GoogleCalendarEvent, 'id'>;
}

interface UpdateEventPayload {
  action: 'updateEvent';
  calendarId: string;
  eventData: GoogleCalendarEvent;
}

interface DeleteEventPayload {
  action: 'deleteEvent';
  calendarId: string;
  eventData: { id: string };
}

type GoogleCalendarSyncPayload = CreateEventPayload | UpdateEventPayload | DeleteEventPayload;

export function useGoogleCalendarSync() {
  return useMutation({
    mutationFn: async (payload: GoogleCalendarSyncPayload) => {
      try {
        // Chamada segura para a Edge Function, que contém as credenciais e a lógica OAuth
        const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
          body: payload,
        });

        if (error) {
          // Erro de rede ou erro retornado pelo runtime da Edge Function
          throw new Error(error.message);
        }
        
        // O Edge Function retorna { success: boolean, error?: string, event?: ... }
        if (data && data.error) {
            throw new Error(data.error);
        }

        return data;
      } catch (err: any) {
        console.error("Erro ao invocar Edge Function para Google Calendar:", err);
        throw err;
      }
    },
    onError: (error: Error) => {
      console.error("Falha na sincronização do Google Calendar:", error);
      toast.error(`Erro na sincronização: ${error.message}`);
    },
  });
}
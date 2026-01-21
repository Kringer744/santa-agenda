/**
 * Módulo de autenticação OAuth 2.0 para Google Calendar
 * Compatível com Edge Runtime (Cloudflare, Vercel Edge, etc.)
 * Sem dependências de Node.js (util, crypto, stream)
 */

interface OAuthTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
}

interface GoogleCalendarError {
  error: {
    code: number;
    message: string;
    status: string;
    details?: Array<{ '@type': string; reason: string }>;
  };
}

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * Renova o access token usando o refresh token
 * @param clientId - ID do cliente OAuth
 * @param clientSecret - Segredo do cliente OAuth
 * @param refreshToken - Refresh token armazenado
 * @returns Promise com o novo access token ou null em caso de erro
 */
export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');

    const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data: OAuthTokenResponse | GoogleCalendarError = await response.json();

    if (!response.ok) {
      if ('error' in data && data.error.code === 400 && data.error.status === 'INVALID_ARGUMENT') {
        console.error('[Google OAuth] Refresh token inválido ou expirado:', data.error);
        return null;
      }
      throw new Error(`OAuth Error: ${JSON.stringify(data)}`);
    }

    if ('access_token' in data) {
      return data.access_token;
    }

    return null;
  } catch (error) {
    console.error('[Google OAuth] Erro ao renovar token:', error);
    return null;
  }
}

/**
 * Cria um evento no Google Calendar
 * @param accessToken - Access token válido
 * @param calendarId - ID do calendário (geralmente o email)
 * @param event - Dados do evento
 * @returns Promise com o evento criado ou null em caso de erro
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleCalendarEvent
): Promise<GoogleCalendarEvent | null> {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const data: GoogleCalendarEvent | GoogleCalendarError = await response.json();

    if (!response.ok) {
      if ('error' in data) {
        console.error('[Google Calendar] API Error:', data.error);
        return null;
      }
      throw new Error(`Google Calendar API Error: ${JSON.stringify(data)}`);
    }

    return data as GoogleCalendarEvent;
  } catch (error) {
    console.error('[Google Calendar] Erro ao criar evento:', error);
    return null;
  }
}

/**
 * Atualiza um evento no Google Calendar
 * @param accessToken - Access token válido
 * @param calendarId - ID do calendário
 * @param eventId - ID do evento a ser atualizado
 * @param event - Dados atualizados do evento
 * @returns Promise com o evento atualizado ou null em caso de erro
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: GoogleCalendarEvent
): Promise<GoogleCalendarEvent | null> {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const data: GoogleCalendarEvent | GoogleCalendarError = await response.json();

    if (!response.ok) {
      if ('error' in data) {
        console.error('[Google Calendar] API Error:', data.error);
        return null;
      }
      throw new Error(`Google Calendar API Error: ${JSON.stringify(data)}`);
    }

    return data as GoogleCalendarEvent;
  } catch (error) {
    console.error('[Google Calendar] Erro ao atualizar evento:', error);
    return null;
  }
}

/**
 * Exclui um evento no Google Calendar
 * @param accessToken - Access token válido
 * @param calendarId - ID do calendário
 * @param eventId - ID do evento a ser excluído
 * @returns Promise com true em caso de sucesso, false em caso de erro
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData: GoogleCalendarError = await response.json();
      console.error('[Google Calendar] Erro ao excluir evento:', errorData.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Google Calendar] Erro ao excluir evento:', error);
    return false;
  }
}

/**
 * Lista eventos de um calendário em um período específico
 * @param accessToken - Access token válido
 * @param calendarId - ID do calendário
 * @param timeMin - Data/hora mínima (ISO string)
 * @param timeMax - Data/hora máxima (ISO string)
 * @returns Promise com a lista de eventos ou null em caso de erro
 */
export async function listGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<{ items: GoogleCalendarEvent[] } | null> {
  try {
    const params = new URLSearchParams();
    params.append('timeMin', timeMin);
    params.append('timeMax', timeMax);
    params.append('singleEvents', 'true');
    params.append('orderBy', 'startTime');

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data: { items: GoogleCalendarEvent[] } | GoogleCalendarError = await response.json();

    if (!response.ok) {
      if ('error' in data) {
        console.error('[Google Calendar] API Error:', data.error);
        return null;
      }
      throw new Error(`Google Calendar API Error: ${JSON.stringify(data)}`);
    }

    return data as { items: GoogleCalendarEvent[] };
  } catch (error) {
    console.error('[Google Calendar] Erro ao listar eventos:', error);
    return null;
  }
}

/**
 * Classe para gerenciar o ciclo de vida do token OAuth
 * Armazena o token em memória e renova automaticamente quando necessário
 */
export class GoogleOAuthManager {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
  }

  /**
   * Obtém um access token válido, renovando se necessário
   * @returns Promise com o access token válido ou null em caso de erro
   */
  async getValidAccessToken(): Promise<string | null> {
    // Se não temos token ou ele está expirado (ou prestes a expirar em 60 segundos)
    if (!this.accessToken || !this.tokenExpiry || Date.now() > this.tokenExpiry - 60000) {
      const newToken = await refreshAccessToken(this.clientId, this.clientSecret, this.refreshToken);
      if (!newToken) {
        return null;
      }
      this.accessToken = newToken;
      // Token geralmente expira em 1 hora (3600 segundos)
      this.tokenExpiry = Date.now() + 3600000;
    }

    return this.accessToken;
  }

  /**
   * Verifica se o refresh token está válido
   * @returns Promise com true se válido, false se inválido
   */
  async checkRefreshTokenValidity(): Promise<boolean> {
    const token = await this.getValidAccessToken();
    return token !== null;
  }
}
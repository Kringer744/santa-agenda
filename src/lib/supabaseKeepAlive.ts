import { supabase } from '@/integrations/supabase/client';

const KEEP_ALIVE_INTERVAL = 1000 * 60 * 60 * 4; // 4 horas

let intervalId: ReturnType<typeof setInterval> | null = null;

async function ping() {
  try {
    const { error } = await supabase.from('clinicas').select('id').limit(1);
    if (error) {
      console.warn('[KeepAlive] Ping falhou:', error.message);
    } else {
      console.log('[KeepAlive] Ping OK -', new Date().toISOString());
    }
  } catch (err) {
    console.warn('[KeepAlive] Erro no ping:', err);
  }
}

export function startKeepAlive() {
  if (intervalId) return; // Já rodando

  // Ping imediato ao iniciar
  ping();

  // Repete a cada 4 horas
  intervalId = setInterval(ping, KEEP_ALIVE_INTERVAL);
}

export function stopKeepAlive() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

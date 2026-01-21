import { supabase } from '@/integrations/supabase/client';
import { sendTextMessage } from '@/lib/uazap';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Consulta, Paciente, Dentista, WhatsAppMenuConfig } from '@/types';

export async function loadWhatsAppConfig(): Promise<WhatsAppMenuConfig | null> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as any as WhatsAppMenuConfig;
  } catch (error) {
    console.error('Erro ao carregar configuração do WhatsApp:', error);
    return null;
  }
}

async function getTemplate(type: string) {
  const { data } = await supabase
    .from('whatsapp_templates')
    .select('*')
    .eq('tipo', type)
    .eq('ativo', true)
    .maybeSingle();
  return data;
}

function replaceTemplateVariables(
  template: string,
  paciente: Paciente,
  dentista: Dentista | null = null,
  consulta: Consulta | null = null
): string {
  let message = template.replace(/\{\{nome_paciente\}\}/g, paciente.nome);
  message = message.replace(/\{\{nome\}\}/g, paciente.nome);

  if (dentista) {
    message = message.replace(/\{\{nome_dentista\}\}/g, dentista.nome);
  }

  if (consulta) {
    const dataObj = new Date(consulta.data_hora_inicio);
    message = message
      .replace(/\{\{data_consulta\}\}/g, format(dataObj, 'dd/MM/yyyy', { locale: ptBR }))
      .replace(/\{\{hora_consulta\}\}/g, format(dataObj, 'HH:mm', { locale: ptBR }));
  }

  return message;
}

// Disparo único ao criar/confirmar consulta manualmente
export async function checkAndSendAutomatedMessages(consulta: Consulta) {
  const config = await loadWhatsAppConfig();
  if (!config?.api_url || !config?.instance_token) return;

  const { data: paciente } = await supabase.from('pacientes').select('*').eq('id', consulta.paciente_id).single();
  const { data: dentista } = await supabase.from('dentistas').select('*').eq('id', consulta.dentista_id).single();

  if (!paciente) return;

  const template = await getTemplate('confirmacao_consulta');
  if (template) {
    const message = replaceTemplateVariables(template.mensagem, paciente as any, dentista as any, consulta);
    await sendTextMessage({ apiUrl: config.api_url, instanceToken: config.instance_token }, paciente.telefone, message);
  }
}

// Busca aniversariantes do mês (necessário para a página WhatsApp)
export async function getPatientsWithBirthdayThisMonth(): Promise<Paciente[]> {
  const { data: allPacientes } = await supabase.from('pacientes').select('*');
  const month = new Date().getUTCMonth() + 1;
  
  return (allPacientes || []).filter(p => {
    if (!p.data_nascimento) return false;
    const d = new Date(p.data_nascimento);
    return (d.getUTCMonth() + 1) === month;
  }) as Paciente[];
}

export async function sendRemindersForDate(date: Date): Promise<{ success: number; total: number }> {
  try {
    const config = await loadWhatsAppConfig();
    if (!config?.api_url || !config?.instance_token) return { success: 0, total: 0 };

    const start = startOfDay(date).toISOString();
    const end = endOfDay(date).toISOString();

    const { data: consultas } = await supabase
      .from('consultas')
      .select('*, pacientes(*), dentistas(*)')
      .gte('data_hora_inicio', start)
      .lte('data_hora_inicio', end)
      .in('status', ['agendada', 'confirmada']);

    if (!consultas || consultas.length === 0) return { success: 0, total: 0 };

    const template = await getTemplate('lembrete_consulta');
    if (!template) return { success: 0, total: 0 };

    let successCount = 0;
    for (const item of consultas) {
      const consulta = item as any;
      const paciente = item.pacientes as any as Paciente;
      
      const { data: alreadySent } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('consulta_id', consulta.id)
        .eq('tipo', 'lembrete_consulta')
        .gte('created_at', startOfDay(new Date()).toISOString())
        .limit(1);

      if (alreadySent && alreadySent.length > 0) continue;

      const message = replaceTemplateVariables(template.mensagem, paciente, item.dentistas as any, consulta);
      const res = await sendTextMessage({ apiUrl: config.api_url, instanceToken: config.instance_token }, paciente.telefone, message);

      if (res.success) {
        successCount++;
        await supabase.from('whatsapp_messages').insert({
          tipo: 'lembrete_consulta',
          destinatario: paciente.telefone,
          mensagem: message,
          status: 'enviada',
          consulta_id: consulta.id,
          paciente_id: paciente.id
        });
      }
    }

    return { success: successCount, total: consultas.length };
  } catch (error) {
    console.error('Erro ao enviar lembretes:', error);
    return { success: 0, total: 0 };
  }
}

export async function processDailyBirthdays(): Promise<number> {
  try {
    const config = await loadWhatsAppConfig();
    if (!config?.parabens_automatico || !config?.api_url || !config?.instance_token) return 0;

    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;

    const { data: allPacientes } = await supabase.from('pacientes').select('*');
    const birthdayLeads = (allPacientes || []).filter(p => {
      if (!p.data_nascimento) return false;
      const d = new Date(p.data_nascimento);
      return (d.getUTCDate() === day && (d.getUTCMonth() + 1) === month);
    });

    if (birthdayLeads.length === 0) return 0;

    const template = await getTemplate('aniversario_paciente');
    if (!template) return 0;

    let sentCount = 0;
    const todayStart = startOfDay(new Date()).toISOString();

    for (const paciente of birthdayLeads) {
      const { data: alreadySent } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('paciente_id', paciente.id)
        .eq('tipo', 'aniversario_paciente')
        .gte('created_at', todayStart)
        .limit(1);

      if (alreadySent && alreadySent.length > 0) continue;

      const message = replaceTemplateVariables(template.mensagem, paciente as any);
      const res = await sendTextMessage({ apiUrl: config.api_url, instanceToken: config.instance_token }, paciente.telefone, message);

      if (res.success) {
        sentCount++;
        await supabase.from('whatsapp_messages').insert({
          tipo: 'aniversario_paciente',
          destinatario: paciente.telefone,
          mensagem: message,
          status: 'enviada',
          paciente_id: paciente.id
        });
      }
    }

    return sentCount;
  } catch (error) {
    console.error('Erro no processamento de aniversários:', error);
    return 0;
  }
}

export async function runDailyAutomations() {
  const tomorrowRes = await sendRemindersForDate(addDays(new Date(), 1));
  const todayRes = await sendRemindersForDate(new Date());
  const birthdayCount = await processDailyBirthdays();
  
  return {
    reminders: tomorrowRes.success + todayRes.success,
    birthdays: birthdayCount
  };
}
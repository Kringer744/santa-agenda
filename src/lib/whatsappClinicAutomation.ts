import { supabase } from '@/integrations/supabase/client';
import { sendTextMessage } from '@/lib/uazap';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Consulta, Paciente, Dentista } from '@/types';

interface WhatsAppConfig {
  apiUrl: string;
  instanceToken: string;
}

interface Template {
  id: string;
  nome: string;
  tipo: string;
  mensagem: string;
  ativo: boolean;
}

export async function loadWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('api_url, instance_token')
      .limit(1)
      .maybeSingle();
      
    if (error) throw error;
    
    if (data) {
      return {
        apiUrl: data.api_url,
        instanceToken: data.instance_token
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao carregar configuração do WhatsApp:', error);
    return null;
  }
}

export async function loadActiveTemplates(): Promise<Template[]> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('ativo', true);
      
    if (error) throw error;
    
    return data as any as Template[];
  } catch (error) {
    console.error('Erro ao carregar templates:', error);
    return [];
  }
}

export async function getPaciente(pacienteId: string): Promise<Paciente | null> {
  try {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', pacienteId)
      .maybeSingle();
      
    if (error) throw error;
    
    return data as any as Paciente;
  } catch (error) {
    console.error('Erro ao carregar paciente:', error);
    return null;
  }
}

export async function getDentista(dentistaId: string): Promise<Dentista | null> {
  try {
    const { data, error } = await supabase
      .from('dentistas')
      .select('*')
      .eq('id', dentistaId)
      .maybeSingle();
      
    if (error) throw error;
    
    return data as any as Dentista;
  } catch (error) {
    console.error('Erro ao carregar dentista:', error);
    return null;
  }
}

export async function getPatientsWithBirthdayToday(): Promise<Paciente[]> {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const { data, error } = await supabase
      .from('pacientes')
      .select('*');

    if (error) throw error;

    const patients = data as any as Paciente[];
    return patients.filter(paciente => {
      if (!paciente.data_nascimento) return false;
      const dob = new Date(paciente.data_nascimento);
      return dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay;
    });
  } catch (error) {
    console.error('Erro ao carregar pacientes com aniversário hoje:', error);
    return [];
  }
}

function replaceTemplateVariables(
  template: string,
  paciente: Paciente,
  dentista: Dentista | null,
  consulta: Consulta | null
): string {
  let message = template.replace(/\{\{nome_paciente\}\}/g, paciente.nome);

  if (dentista) {
    message = message.replace(/\{\{nome_dentista\}\}/g, dentista.nome);
  } else {
    message = message.replace(/\{\{nome_dentista\}\}/g, 'o dentista');
  }

  if (consulta) {
    message = message
      .replace(/\{\{data_consulta\}\}/g, format(new Date(consulta.data_hora_inicio), 'dd/MM/yyyy', { locale: ptBR }))
      .replace(/\{\{hora_consulta\}\}/g, format(new Date(consulta.data_hora_inicio), 'HH:mm', { locale: ptBR }));
  }
  
  return message;
}

export async function sendAutomatedMessage(
  consulta: Consulta,
  templateType: string
): Promise<boolean> {
  try {
    const config = await loadWhatsAppConfig();
    if (!config) return false;
    
    const templates = await loadActiveTemplates();
    const template = templates.find(t => t.tipo === templateType);
    if (!template) return false;
    
    const paciente = await getPaciente(consulta.paciente_id);
    const dentista = await getDentista(consulta.dentista_id);
    if (!paciente) return false;
    
    const message = replaceTemplateVariables(template.mensagem, paciente, dentista, consulta);
    const result = await sendTextMessage(config, paciente.telefone, message);
    
    if (result.success) {
      await (supabase.from('whatsapp_messages') as any).insert({
        tipo: templateType,
        destinatario: paciente.telefone,
        mensagem: message,
        status: 'enviada',
        consulta_id: consulta.id,
        paciente_id: paciente.id,
        dentista_id: dentista?.id || null
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Erro ao enviar mensagem ${templateType}:`, error);
    return false;
  }
}

export async function checkAndSendAutomatedMessages(consulta: Consulta): Promise<void> {
  try {
    if (consulta.status === 'confirmada' && consulta.data_hora_inicio) {
      const consultaDate = new Date(consulta.data_hora_inicio);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (
        consultaDate.getDate() === tomorrow.getDate() &&
        consultaDate.getMonth() === tomorrow.getMonth() &&
        consultaDate.getFullYear() === tomorrow.getFullYear()
      ) {
        const { data: existingMessage } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('consulta_id', consulta.id)
          .eq('tipo', 'lembrete_consulta')
          .eq('status', 'enviada');
        
        if (!existingMessage || existingMessage.length === 0) {
          await sendAutomatedMessage(consulta, 'lembrete_consulta');
        }
      }
    }
    
    if (consulta.status === 'realizada') {
      const { data: existingMessage } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('consulta_id', consulta.id)
        .eq('tipo', 'pos_consulta')
        .eq('status', 'enviada');
      
      if (!existingMessage || existingMessage.length === 0) {
        await sendAutomatedMessage(consulta, 'pos_consulta');
      }
    }
  } catch (error) {
    console.error('Erro ao verificar mensagens automáticas:', error);
  }
}

export async function sendBirthdayMessage(paciente: Paciente, template: Template, config: WhatsAppConfig): Promise<boolean> {
  try {
    const message = replaceTemplateVariables(template.mensagem, paciente, null, null);
    const result = await sendTextMessage(config, paciente.telefone, message);
    
    if (result.success) {
      await (supabase.from('whatsapp_messages') as any).insert({
        tipo: 'aniversario_paciente',
        destinatario: paciente.telefone,
        mensagem: message,
        status: 'enviada',
        paciente_id: paciente.id,
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao enviar mensagem de aniversário:', error);
    return false;
  }
}
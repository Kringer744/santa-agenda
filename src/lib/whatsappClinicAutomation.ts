import { supabase } from '@/integrations/supabase/client';
import { sendTextMessage } from '@/lib/uazap';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Consulta, Paciente, Dentista } from '@/types'; // Updated types

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

// Carregar configuração do WhatsApp
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

// Carregar templates ativos
export async function loadActiveTemplates(): Promise<Template[]> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('ativo', true);
      
    if (error) throw error;
    
    return data as Template[];
  } catch (error) {
    console.error('Erro ao carregar templates:', error);
    return [];
  }
}

// Obter dados do paciente
export async function getPaciente(pacienteId: string): Promise<Paciente | null> { // Changed function name and type
  try {
    const { data, error } = await supabase
      .from('pacientes') // Changed table name
      .select('id, nome, telefone')
      .eq('id', pacienteId)
      .maybeSingle();
      
    if (error) throw error;
    
    return data as Paciente;
  } catch (error) {
    console.error('Erro ao carregar paciente:', error);
    return null;
  }
}

// Obter dados do dentista
export async function getDentista(dentistaId: string): Promise<Dentista | null> { // Changed function name and type
  try {
    const { data, error } = await supabase
      .from('dentistas') // Changed table name
      .select('id, nome, especialidade')
      .eq('id', dentistaId)
      .maybeSingle();
      
    if (error) throw error;
    
    return data as Dentista;
  } catch (error) {
    console.error('Erro ao carregar dentista:', error);
    return null;
  }
}

// Substituir variáveis no template
function replaceTemplateVariables(
  template: string,
  paciente: Paciente, // Changed from tutor
  dentista: Dentista | null, // Changed from pet, now optional
  consulta: Consulta | null // Changed from reserva, now optional
): string {
  let message = template
    .replace(/\{\{nome_paciente\}\}/g, paciente.nome); // Changed from nome_tutor

  if (dentista) {
    message = message.replace(/\{\{nome_dentista\}\}/g, dentista.nome); // Changed from nome_pet
  } else {
    message = message.replace(/\{\{nome_dentista\}\}/g, 'o dentista');
  }

  if (consulta) {
    message = message
      .replace(/\{\{data_consulta\}\}/g, format(new Date(consulta.data_hora_inicio), 'dd/MM/yyyy', { locale: ptBR })) // Changed from data_checkin
      .replace(/\{\{hora_consulta\}\}/g, format(new Date(consulta.data_hora_inicio), 'HH:mm', { locale: ptBR })); // New variable
  }
  
  return message;
}

// Enviar mensagem automática com base no template
export async function sendAutomatedMessage(
  consulta: Consulta, // Changed from reserva
  templateType: string
): Promise<boolean> {
  try {
    // Carregar configuração e templates
    const config = await loadWhatsAppConfig();
    if (!config) {
      console.error('Configuração do WhatsApp não encontrada');
      return false;
    }
    
    const templates = await loadActiveTemplates();
    const template = templates.find(t => t.tipo === templateType);
    
    if (!template) {
      console.error(`Template do tipo ${templateType} não encontrado`);
      return false;
    }
    
    // Carregar dados do paciente e dentista
    const paciente = await getPaciente(consulta.paciente_id); // Changed from tutor
    const dentista = await getDentista(consulta.dentista_id); // Changed from pet
    
    if (!paciente) { // Dentista can be null for some templates
      console.error('Dados do paciente não encontrados');
      return false;
    }
    
    // Substituir variáveis no template
    const message = replaceTemplateVariables(template.mensagem, paciente, dentista, consulta);
    
    // Enviar mensagem
    const result = await sendTextMessage(
      config,
      paciente.telefone,
      message
    );
    
    if (result.success) {
      // Registrar mensagem enviada
      await supabase.from('whatsapp_messages').insert({
        tipo: templateType,
        destinatario: paciente.telefone,
        mensagem: message,
        status: 'enviada',
        consulta_id: consulta.id, // Changed from reserva_id
        paciente_id: paciente.id, // Changed from pet_id
        dentista_id: dentista?.id // Changed from tutor_id
      });
      
      console.log(`Mensagem ${templateType} enviada com sucesso para ${paciente.telefone}`);
      return true;
    } else {
      console.error(`Erro ao enviar mensagem ${templateType}:`, result.error);
      return false;
    }
  } catch (error) {
    console.error(`Erro ao enviar mensagem ${templateType}:`, error);
    return false;
  }
}

// Verificar e enviar mensagens automáticas com base no status da consulta
export async function checkAndSendAutomatedMessages(consulta: Consulta): Promise<void> { // Changed from reserva
  try {
    // Verificar se deve enviar lembrete de consulta (1 dia antes da data_hora_inicio)
    if (consulta.status === 'confirmada' && consulta.data_hora_inicio) {
      const consultaDate = new Date(consulta.data_hora_inicio);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Verificar se a consulta é amanhã
      if (
        consultaDate.getDate() === tomorrow.getDate() &&
        consultaDate.getMonth() === tomorrow.getMonth() &&
        consultaDate.getFullYear() === tomorrow.getFullYear()
      ) {
        // Verificar se já foi enviada
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
    
    // Verificar se deve enviar mensagem pós-consulta (quando o status mudar para 'realizada')
    if (consulta.status === 'realizada') {
      // Verificar se já foi enviada
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

// Enviar mensagem de aniversário do paciente
export async function sendBirthdayMessage(pacienteId: string): Promise<boolean> { // Changed from petId
  try {
    // Carregar configuração e templates
    const config = await loadWhatsAppConfig();
    if (!config) {
      console.error('Configuração do WhatsApp não encontrada');
      return false;
    }
    
    const templates = await loadActiveTemplates();
    const template = templates.find(t => t.tipo === 'aniversario_paciente'); // Changed type
    
    if (!template) {
      console.error('Template de aniversário não encontrado');
      return false;
    }
    
    // Carregar dados do paciente
    const paciente = await getPaciente(pacienteId); // Changed from pet
    if (!paciente) {
      console.error('Paciente não encontrado');
      return false;
    }
    
    // Substituir variáveis no template
    const message = replaceTemplateVariables(template.mensagem, paciente, null, null); // No dentista or consulta context for birthday
    
    // Enviar mensagem
    const result = await sendTextMessage(
      config,
      paciente.telefone,
      message
    );
    
    if (result.success) {
      // Registrar mensagem enviada
      await supabase.from('whatsapp_messages').insert({
        tipo: 'aniversario_paciente', // Changed type
        destinatario: paciente.telefone,
        mensagem: message,
        status: 'enviada',
        paciente_id: paciente.id, // Changed from pet_id
      });
      
      console.log(`Mensagem de aniversário enviada com sucesso para ${paciente.telefone}`);
      return true;
    } else {
      console.error('Erro ao enviar mensagem de aniversário:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem de aniversário:', error);
    return false;
  }
}
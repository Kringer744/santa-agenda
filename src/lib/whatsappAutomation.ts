import { supabase } from '@/integrations/supabase/client';
import { sendTextMessage } from '@/lib/uazap';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface Reserva {
  id: string;
  tutor_id: string;
  pet_id: string;
  check_in: string;
  check_out: string;
  status: string;
}

interface Tutor {
  id: string;
  nome: string;
  telefone: string;
}

interface Pet {
  id: string;
  nome: string;
  especie: string;
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

// Obter dados do tutor
export async function getTutor(tutorId: string): Promise<Tutor | null> {
  try {
    const { data, error } = await supabase
      .from('tutores')
      .select('id, nome, telefone')
      .eq('id', tutorId)
      .maybeSingle();
      
    if (error) throw error;
    
    return data as Tutor;
  } catch (error) {
    console.error('Erro ao carregar tutor:', error);
    return null;
  }
}

// Obter dados do pet
export async function getPet(petId: string): Promise<Pet | null> {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select('id, nome, especie')
      .eq('id', petId)
      .maybeSingle();
      
    if (error) throw error;
    
    return data as Pet;
  } catch (error) {
    console.error('Erro ao carregar pet:', error);
    return null;
  }
}

// Substituir variáveis no template
function replaceTemplateVariables(
  template: string,
  tutor: Tutor,
  pet: Pet,
  reserva: Reserva
): string {
  return template
    .replace(/\{\{nome_pet\}\}/g, pet.nome)
    .replace(/\{\{nome_tutor\}\}/g, tutor.nome)
    .replace(/\{\{data_checkin\}\}/g, format(new Date(reserva.check_in), 'dd/MM/yyyy', { locale: ptBR }))
    .replace(/\{\{data_checkout\}\}/g, format(new Date(reserva.check_out), 'dd/MM/yyyy', { locale: ptBR }));
}

// Enviar mensagem automática com base no template
export async function sendAutomatedMessage(
  reserva: Reserva,
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
    
    // Carregar dados do tutor e pet
    const tutor = await getTutor(reserva.tutor_id);
    const pet = await getPet(reserva.pet_id);
    
    if (!tutor || !pet) {
      console.error('Dados do tutor ou pet não encontrados');
      return false;
    }
    
    // Substituir variáveis no template
    const message = replaceTemplateVariables(template.mensagem, tutor, pet, reserva);
    
    // Enviar mensagem
    const result = await sendTextMessage(
      config,
      tutor.telefone,
      message
    );
    
    if (result.success) {
      // Registrar mensagem enviada
      await supabase.from('whatsapp_messages').insert({
        tipo: templateType,
        destinatario: tutor.telefone,
        mensagem: message,
        status: 'enviada',
        reserva_id: reserva.id,
        pet_id: pet.id,
        tutor_id: tutor.id
      });
      
      console.log(`Mensagem ${templateType} enviada com sucesso para ${tutor.telefone}`);
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

// Verificar e enviar mensagens automáticas com base no status da reserva
export async function checkAndSendAutomatedMessages(reserva: Reserva): Promise<void> {
  try {
    // Verificar se deve enviar mensagem de pré-estadia (1 dia antes do check-in)
    if (reserva.status === 'confirmada' && reserva.check_in) {
      const checkInDate = new Date(reserva.check_in);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Verificar se o check-in é amanhã
      if (
        checkInDate.getDate() === tomorrow.getDate() &&
        checkInDate.getMonth() === tomorrow.getMonth() &&
        checkInDate.getFullYear() === tomorrow.getFullYear()
      ) {
        // Verificar se já foi enviada
        const { data: existingMessage } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('reserva_id', reserva.id)
          .eq('tipo', 'pre-estadia')
          .eq('status', 'enviada');
        
        if (!existingMessage || existingMessage.length === 0) {
          await sendAutomatedMessage(reserva, 'pre-estadia');
        }
      }
    }
    
    // Verificar se deve enviar mensagem durante a estadia (quando o status mudar para 'hospedado')
    if (reserva.status === 'hospedado') {
      // Verificar se já foi enviada
      const { data: existingMessage } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('reserva_id', reserva.id)
        .eq('tipo', 'durante')
        .eq('status', 'enviada');
      
      if (!existingMessage || existingMessage.length === 0) {
        await sendAutomatedMessage(reserva, 'durante');
      }
    }
    
    // Verificar se deve enviar mensagem pós-estadia (quando o status mudar para 'finalizada')
    if (reserva.status === 'finalizada') {
      // Verificar se já foi enviada
      const { data: existingMessage } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('reserva_id', reserva.id)
        .eq('tipo', 'pos-estadia')
        .eq('status', 'enviada');
      
      if (!existingMessage || existingMessage.length === 0) {
        await sendAutomatedMessage(reserva, 'pos-estadia');
      }
    }
  } catch (error) {
    console.error('Erro ao verificar mensagens automáticas:', error);
  }
}

// Enviar mensagem de aniversário do pet
export async function sendBirthdayMessage(petId: string): Promise<boolean> {
  try {
    // Carregar configuração e templates
    const config = await loadWhatsAppConfig();
    if (!config) {
      console.error('Configuração do WhatsApp não encontrada');
      return false;
    }
    
    const templates = await loadActiveTemplates();
    const template = templates.find(t => t.tipo === 'aniversario');
    
    if (!template) {
      console.error('Template de aniversário não encontrado');
      return false;
    }
    
    // Carregar dados do pet e tutor
    const pet = await getPet(petId);
    if (!pet) {
      console.error('Pet não encontrado');
      return false;
    }
    
    const { data: tutorData } = await supabase
      .from('tutores')
      .select('id, nome, telefone')
      .eq('id', pet.id)
      .maybeSingle();
    
    const tutor = tutorData as Tutor;
    if (!tutor) {
      console.error('Tutor não encontrado');
      return false;
    }
    
    // Substituir variáveis no template
    const message = replaceTemplateVariables(template.mensagem, tutor, pet, {
      id: '',
      tutor_id: tutor.id,
      pet_id: pet.id,
      check_in: '',
      check_out: '',
      status: ''
    } as Reserva);
    
    // Enviar mensagem
    const result = await sendTextMessage(
      config,
      tutor.telefone,
      message
    );
    
    if (result.success) {
      // Registrar mensagem enviada
      await supabase.from('whatsapp_messages').insert({
        tipo: 'aniversario',
        destinatario: tutor.telefone,
        mensagem: message,
        status: 'enviada',
        pet_id: pet.id,
        tutor_id: tutor.id
      });
      
      console.log(`Mensagem de aniversário enviada com sucesso para ${tutor.telefone}`);
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
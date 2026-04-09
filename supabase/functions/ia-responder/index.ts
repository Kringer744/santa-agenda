import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// CLASSIFICADOR DE INTENÇÃO (sem LLM - rápido e gratuito)
// Pattern matching robusto com suporte a variações
// ============================================================
interface IntentResult {
  intent: string;
  confidence: number;
  fastResponse?: string;
  extractedData?: Record<string, string>;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .trim();
}

function classificarIntencao(mensagem: string): IntentResult {
  const msg = normalizeText(mensagem);
  const original = mensagem.trim();

  // Saudações
  if (/^(oi|ola|hey|bom dia|boa tarde|boa noite|eai|e ai|oie|hello|hi|fala)\b/.test(msg)) {
    return { intent: "saudacao", confidence: 0.95 };
  }

  // Confirmação SIM (respostas a lembretes)
  if (/^(sim|confirmo|confirmado|pode ser|ok|tudo certo|certo|yes|s|vou sim|estarei la|vou estar|claro|com certeza)\s*[.!]?$/.test(msg)) {
    return {
      intent: "confirmacao_sim",
      confidence: 0.95,
      fastResponse: "Perfeito! Sua consulta esta confirmada. Te esperamos! Qualquer imprevisto, nos avise com antecedencia.",
    };
  }

  // Confirmação NÃO
  if (/^(nao|n|nop|nope|nao posso|nao vou|no|nao da|nao consigo|impossivel)\s*[.!]?$/.test(msg)) {
    return {
      intent: "confirmacao_nao",
      confidence: 0.95,
      fastResponse: "Entendi! Gostaria de reagendar para outro horario? Me diga o dia e horario que prefere.",
    };
  }

  // Cancelamento / Reagendamento
  if (/(cancelar|desmarcar|nao vou|nao posso ir|remarcar|reagendar|trocar.*hora|mudar.*data|adiar)/.test(msg)) {
    return { intent: "cancelamento", confidence: 0.9 };
  }

  // Agendamento
  if (/(agendar|marcar|reservar|horario.*disponiv|vaga|quero.*consulta|preciso.*consulta|quero.*atend|marcar.*hora|agendar.*hora)/.test(msg)) {
    // Tentar extrair dados
    const extracted: Record<string, string> = {};

    // Extrair nome
    const nomeMatch = original.match(/(?:meu nome e|me chamo|sou o|sou a|nome:?)\s+([A-Za-zÀ-ú\s]+)/i);
    if (nomeMatch) extracted.nome = nomeMatch[1].trim();

    // Extrair data
    const dataMatch = msg.match(/(?:dia|data|para|no)\s+(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/);
    if (dataMatch) extracted.data = dataMatch[1];

    // Extrair horário
    const horaMatch = msg.match(/(?:as|hora|horario)\s+(\d{1,2}[h:]\d{0,2})/);
    if (horaMatch) extracted.horario = horaMatch[1];

    return { intent: "agendamento", confidence: 0.9, extractedData: Object.keys(extracted).length > 0 ? extracted : undefined };
  }

  // Preços / Valores
  if (/(preco|valor|custo|quanto custa|quanto e|tabela|orcamento|pagar|pagamento|pix|forma.*pagamento)/.test(msg)) {
    return { intent: "preco", confidence: 0.85 };
  }

  // Horário de funcionamento
  if (/(horario|funciona|abre|fecha|expediente|atende.*que horas|que horas.*atende|aberto|fechado)/.test(msg)) {
    return { intent: "horario", confidence: 0.9 };
  }

  // Endereço / Localização
  if (/(endereco|onde fica|localizacao|como chegar|mapa|rua|avenida|qual.*endereco|fica.*onde)/.test(msg)) {
    return { intent: "endereco", confidence: 0.9 };
  }

  // Emergência / Urgência dental
  if (/(dor|doi|doendo|urgente|urgencia|emergencia|sangr|inchou|inchado|quebrou.*dente|dente.*quebr|abscess|pus|febre.*dente)/.test(msg)) {
    return { intent: "urgencia", confidence: 0.9 };
  }

  // Procedimentos específicos
  if (/(limpeza|clareamento|canal|implante|aparelho|ortodont|extrac|restaura|protese|faceta|gengiv|periodo|raio.?x|radiografia|avaliacao|check.?up)/.test(msg)) {
    return { intent: "procedimento", confidence: 0.85 };
  }

  // Consultar status / "minha consulta"
  if (/(minha.*consulta|status|quando.*proxima|tenho.*consulta|proxima.*consulta|minhas.*consulta)/.test(msg)) {
    return { intent: "status_consulta", confidence: 0.9 };
  }

  // Agradecimento
  if (/^(obrigad|valeu|thanks|brigad|agradeco|muito obrigad|vlw|tmj)/.test(msg)) {
    return {
      intent: "agradecimento",
      confidence: 0.9,
      fastResponse: "De nada! Estamos sempre aqui para cuidar do seu sorriso. Qualquer duvida, e so chamar!",
    };
  }

  // Falar com humano
  if (/(falar.*atendente|falar.*pessoa|atendente|humano|pessoa.*real|nao.*robo|quero.*falar|transferir)/.test(msg)) {
    return {
      intent: "transferir_humano",
      confidence: 0.95,
      fastResponse: "Claro! Vou transferir voce para um atendente humano. Aguarde um momento, por favor.",
    };
  }

  return { intent: "geral", confidence: 0.5 };
}

// ============================================================
// SISTEMA ANTI-ALUCINAÇÃO
// Valida a resposta da IA contra dados reais do banco
// ============================================================
interface ValidationContext {
  procedimentos: any[];
  dentistas: any[];
  horarios: any;
  endereco: string;
  config: any;
}

function validarResposta(resposta: string, ctx: ValidationContext): { isValid: boolean; corrections: string[] } {
  const corrections: string[] = [];
  const respostaLower = resposta.toLowerCase();

  // 1. Verificar se mencionou preços que não existem
  const precosRegex = /r\$\s*(\d+[.,]?\d*)/gi;
  let match;
  while ((match = precosRegex.exec(resposta)) !== null) {
    const precoMencionado = parseFloat(match[1].replace(",", "."));
    const precoExiste = ctx.procedimentos.some(
      (p) => Math.abs(Number(p.preco) - precoMencionado) < 1
    );
    if (!precoExiste && precoMencionado > 0) {
      corrections.push(`Preco R$${precoMencionado.toFixed(2)} nao encontrado nos procedimentos cadastrados.`);
    }
  }

  // 2. Verificar se mencionou dentistas que não existem
  const nomesDentistas = ctx.dentistas.map((d) => normalizeText(d.nome));
  const drRegex = /dr(?:a)?\.?\s+([a-záàâãéèêíóôõúüç\s]+)/gi;
  while ((match = drRegex.exec(resposta)) !== null) {
    const nomeMencionado = normalizeText(match[1]);
    const existe = nomesDentistas.some(
      (n) => n.includes(nomeMencionado) || nomeMencionado.includes(n)
    );
    if (!existe) {
      corrections.push(`Dentista "${match[1].trim()}" nao encontrado no corpo clinico.`);
    }
  }

  // 3. Verificar se mencionou procedimentos que não existem
  const procNomes = ctx.procedimentos.map((p) => normalizeText(p.nome));
  const procedimentosMencionados = ctx.procedimentos.filter((p) => {
    const nomeNorm = normalizeText(p.nome);
    return respostaLower.includes(nomeNorm);
  });

  // 4. Verificar se inventou horários de funcionamento
  const horaRegex = /(\d{1,2})[h:]\s*(\d{2})?\s*(?:as|ate|a)\s*(\d{1,2})[h:]\s*(\d{2})?/gi;
  while ((match = horaRegex.exec(resposta)) !== null) {
    // Não validar se é horário de consulta, apenas funcionamento
    if (respostaLower.includes("funcionamento") || respostaLower.includes("atendimento")) {
      const horaAbr = parseInt(match[1]);
      const horaFech = parseInt(match[3]);
      if (ctx.horarios) {
        const horariosArr = Object.values(ctx.horarios).filter(Boolean) as any[];
        const horaAberturaReal = horariosArr.length > 0 ? parseInt(horariosArr[0].inicio) : null;
        const horaFechamentoReal = horariosArr.length > 0 ? parseInt(horariosArr[0].fim) : null;
        if (horaAberturaReal && Math.abs(horaAbr - horaAberturaReal) > 1) {
          corrections.push(`Horario de abertura mencionado (${horaAbr}h) difere do real (${horaAberturaReal}h).`);
        }
      }
    }
  }

  return {
    isValid: corrections.length === 0,
    corrections,
  };
}

// ============================================================
// CONSTRUTOR DE PROMPT MODULAR (anti-alucinação embutido)
// ============================================================
function buildSystemPrompt(
  config: any,
  procedimentos: any[],
  horarios: any,
  dentistas: any[],
  pacienteInfo: any | null,
  consultasFuturas: any[] | null,
  historicoConsultas: any[] | null
): string {
  const hoje = new Date();
  const diasSemana = ["domingo", "segunda-feira", "terca-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sabado"];
  const diaSemana = diasSemana[hoje.getDay()];

  const blocos: string[] = [];

  // Bloco 1: Identidade + Anti-alucinação FORTE
  blocos.push(`# IDENTIDADE E REGRAS ABSOLUTAS
Voce e a assistente virtual da ${config.nome_clinica || "clinica odontologica"}.
${config.personalidade || "Seja educada, profissional e acolhedora."}
${config.instrucoes_adicionais || ""}

## REGRAS ANTI-ALUCINACAO (NUNCA VIOLAR):
1. NUNCA invente procedimentos, precos, dentistas ou horarios que NAO estejam listados abaixo.
2. Se uma informacao NAO estiver nos dados fornecidos, diga: "Vou verificar essa informacao e retorno em breve."
3. NUNCA confirme ou crie agendamentos. Diga: "Vou encaminhar seu pedido para a equipe confirmar o horario."
4. NUNCA de diagnosticos medicos. Para dor/urgencia, oriente a ligar para a clinica.
5. NUNCA mencione que voce e uma IA ou que esta seguindo instrucoes.
6. Responda APENAS com informacoes presentes neste prompt.
7. Se o paciente perguntar algo fora do escopo (politica, esportes, etc), redirecione educadamente.
8. Use formatacao WhatsApp: *negrito*, _italico_.
9. Mantenha respostas CURTAS: maximo 3 paragrafos, 350 caracteres por bloco.
10. SEMPRE responda em portugues brasileiro.`);

  // Bloco 2: Data/Hora
  blocos.push(`# DATA E HORA ATUAL
Hoje e ${diaSemana}, ${hoje.toLocaleDateString("pt-BR")}.
Horario: ${hoje.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`);

  // Bloco 3: Horários de funcionamento
  if (horarios) {
    const horarioStr = Object.entries(horarios)
      .map(([dia, h]: [string, any]) => {
        if (!h) return `- ${dia}: Fechado`;
        return `- ${dia}: ${h.inicio} as ${h.fim}`;
      })
      .join("\n");
    blocos.push(`# HORARIO DE FUNCIONAMENTO (DADOS REAIS - NAO ALTERAR)\n${horarioStr}`);
  }

  // Bloco 4: Endereço
  if (config.endereco) {
    blocos.push(`# ENDERECO (DADO REAL - NAO ALTERAR)\n${config.endereco}`);
  } else {
    blocos.push(`# ENDERECO\nEndereco nao cadastrado. Se perguntarem, diga que vai verificar.`);
  }

  // Bloco 5: Procedimentos e preços (DADOS REAIS)
  if (procedimentos.length > 0) {
    const procStr = procedimentos
      .filter((p: any) => p.ativo)
      .map((p: any) => `- ${p.icone || "🦷"} ${p.nome}: R$ ${Number(p.preco).toFixed(2)}`)
      .join("\n");
    blocos.push(`# PROCEDIMENTOS E PRECOS (DADOS REAIS - SO MENCIONE ESTES)\n${procStr}\n\nSe o paciente perguntar sobre um procedimento que NAO esta nesta lista, diga que vai verificar com a equipe.`);
  } else {
    blocos.push(`# PROCEDIMENTOS\nNenhum procedimento cadastrado. Diga ao paciente que vai verificar os servicos disponiveis.`);
  }

  // Bloco 6: Dentistas (DADOS REAIS)
  if (dentistas.length > 0) {
    const dentStr = dentistas
      .map((d: any) => {
        const procs = d.procedimentos?.length > 0 ? ` | Procedimentos: ${d.procedimentos.join(", ")}` : "";
        return `- Dr(a). ${d.nome} (${d.especialidade || "Clinico Geral"}) - CRO: ${d.cro}${procs}`;
      })
      .join("\n");
    blocos.push(`# CORPO CLINICO (DADOS REAIS - SO MENCIONE ESTES)\n${dentStr}`);
  }

  // Bloco 7: Info do paciente (se identificado)
  if (pacienteInfo) {
    let pacStr = `# PACIENTE IDENTIFICADO (use estas infos para personalizar)\nNome: ${pacienteInfo.nome}`;
    if (pacienteInfo.observacoes) pacStr += `\nObservacoes clinicas: ${pacienteInfo.observacoes}`;
    if (pacienteInfo.data_nascimento) {
      const nasc = new Date(pacienteInfo.data_nascimento);
      const idade = Math.floor((hoje.getTime() - nasc.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      pacStr += `\nIdade: ${idade} anos`;
    }
    if (pacienteInfo.meses_retorno) pacStr += `\nRetorno recomendado: a cada ${pacienteInfo.meses_retorno} meses`;
    if (pacienteInfo.tags?.length > 0) pacStr += `\nTags: ${pacienteInfo.tags.join(", ")}`;

    blocos.push(pacStr);
  }

  // Bloco 8: Consultas do paciente
  if (consultasFuturas && consultasFuturas.length > 0) {
    const consultaStr = consultasFuturas
      .map((c: any) => {
        const dt = new Date(c.data_hora_inicio);
        return `- ${dt.toLocaleDateString("pt-BR")} as ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} | Status: ${c.status} | Dentista: ${c.dentista_nome || "N/A"}`;
      })
      .join("\n");
    blocos.push(`# CONSULTAS FUTURAS DO PACIENTE\n${consultaStr}`);
  }

  // Bloco 9: Histórico (últimas consultas realizadas)
  if (historicoConsultas && historicoConsultas.length > 0) {
    const histStr = historicoConsultas
      .map((c: any) => {
        const dt = new Date(c.data_hora_inicio);
        return `- ${dt.toLocaleDateString("pt-BR")} | ${c.procedimentos?.join(", ") || "Consulta geral"} | ${c.status}`;
      })
      .join("\n");
    blocos.push(`# HISTORICO RECENTE DO PACIENTE (ultimas consultas)\n${histStr}`);
  }

  // Bloco 10: Guia de resposta por intenção
  blocos.push(`# GUIA DE RESPOSTAS POR SITUACAO
- AGENDAMENTO: Pergunte nome, procedimento, data/horario preferido. Diga que vai verificar disponibilidade.
- CANCELAMENTO: Pergunte nome e data da consulta. Diga que vai encaminhar o cancelamento.
- PRECO: Informe APENAS precos listados acima. Nunca invente valores.
- URGENCIA/DOR: Demonstre empatia, recomende ligar para a clinica, ou ir ao pronto-socorro odontologico.
- FALAR COM HUMANO: Diga que vai transferir e encerre cordialmente.`);

  return blocos.join("\n\n");
}

// ============================================================
// EXTRATOR DE DADOS DO PACIENTE (salva info no banco)
// ============================================================
async function extractAndSavePatientData(
  supabase: any,
  telefone: string,
  mensagem: string,
  conversa: any
) {
  const msg = normalizeText(mensagem);

  // Tentar extrair nome
  const nomeMatch = mensagem.match(/(?:meu nome e|me chamo|sou o|sou a|pode me chamar de|nome:?)\s+([A-Za-zÀ-ú\s]{2,40})/i);
  if (nomeMatch && !conversa?.paciente_id) {
    const nomeExtraido = nomeMatch[1].trim();

    // Buscar se paciente já existe com esse telefone
    const { data: existente } = await supabase
      .from("pacientes")
      .select("id")
      .eq("telefone", telefone)
      .maybeSingle();

    if (!existente) {
      // Criar novo paciente
      const { data: novoPaciente } = await supabase
        .from("pacientes")
        .insert({
          nome: nomeExtraido,
          telefone,
          cpf: `PENDENTE-${Date.now()}`, // CPF será preenchido depois
          tags: ["via-whatsapp"],
        })
        .select("id")
        .single();

      if (novoPaciente) {
        // Vincular à conversa
        await supabase
          .from("ia_conversas")
          .update({ paciente_id: novoPaciente.id })
          .eq("id", conversa.id);

        return { action: "paciente_criado", nome: nomeExtraido, id: novoPaciente.id };
      }
    } else {
      // Vincular paciente existente à conversa
      await supabase
        .from("ia_conversas")
        .update({ paciente_id: existente.id })
        .eq("id", conversa.id);

      return { action: "paciente_vinculado", id: existente.id };
    }
  }

  // Extrair e salvar email se mencionado
  const emailMatch = mensagem.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  if (emailMatch && conversa?.paciente_id) {
    await supabase
      .from("pacientes")
      .update({ email: emailMatch[0] })
      .eq("id", conversa.paciente_id);

    return { action: "email_salvo", email: emailMatch[0] };
  }

  // Extrair data de nascimento
  const nascMatch = mensagem.match(/(?:nasci em|nascimento|aniversario|nasci dia)\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i);
  if (nascMatch && conversa?.paciente_id) {
    const dia = nascMatch[1].padStart(2, "0");
    const mes = nascMatch[2].padStart(2, "0");
    let ano = nascMatch[3];
    if (ano.length === 2) ano = parseInt(ano) > 50 ? `19${ano}` : `20${ano}`;
    const dataNasc = `${ano}-${mes}-${dia}`;

    await supabase
      .from("pacientes")
      .update({ data_nascimento: dataNasc })
      .eq("id", conversa.paciente_id);

    return { action: "nascimento_salvo", data: dataNasc };
  }

  return null;
}

// ============================================================
// CHAMADA À LLM (OpenRouter)
// ============================================================
async function callLLM(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  temperature: number
): Promise<{ content: string; tokens_in: number; tokens_out: number; time_ms: number }> {
  const start = Date.now();

  const body = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.slice(-16), // Últimas 16 msgs (8 trocas) para contexto
    ],
    max_tokens: maxTokens,
    temperature,
    top_p: 0.9,
    frequency_penalty: 0.3, // Reduz repetição
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://dentalclinic.app",
      "X-Title": "DentalClinic AI",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const elapsed = Date.now() - start;

  return {
    content: data.choices?.[0]?.message?.content || "Desculpe, nao consegui processar sua mensagem. Tente novamente.",
    tokens_in: data.usage?.prompt_tokens || 0,
    tokens_out: data.usage?.completion_tokens || 0,
    time_ms: elapsed,
  };
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { telefone, mensagem, nome_contato } = await req.json();

    if (!telefone || !mensagem) {
      return new Response(
        JSON.stringify({ error: "telefone e mensagem sao obrigatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Buscar config da IA
    const { data: iaConfig } = await supabase.from("ia_config").select("*").limit(1).maybeSingle();

    if (!iaConfig?.ativo || !iaConfig?.api_key) {
      return new Response(
        JSON.stringify({ success: false, reason: "IA desativada ou sem API key" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Buscar/criar conversa
    let { data: conversa } = await supabase
      .from("ia_conversas")
      .select("*")
      .eq("telefone", telefone)
      .maybeSingle();

    if (!conversa) {
      // Tentar vincular a um paciente pelo telefone
      const { data: paciente } = await supabase
        .from("pacientes")
        .select("id, nome")
        .eq("telefone", telefone)
        .maybeSingle();

      const { data: newConv } = await supabase
        .from("ia_conversas")
        .insert({
          telefone,
          paciente_id: paciente?.id || null,
          contexto: [],
          ia_ativa: true,
        })
        .select()
        .single();

      conversa = newConv;
    }

    // Se atendente assumiu ou IA desativada para esta conversa, não responde
    if (conversa?.atendente_assumiu || !conversa?.ia_ativa) {
      return new Response(
        JSON.stringify({ success: false, reason: "Atendente humano assumiu esta conversa" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Classificar intenção
    const intent = classificarIntencao(mensagem);

    // 4. Extrair e salvar dados do paciente automaticamente
    const extractResult = await extractAndSavePatientData(supabase, telefone, mensagem, conversa);

    // Recarregar conversa se paciente foi vinculado
    if (extractResult?.action === "paciente_criado" || extractResult?.action === "paciente_vinculado") {
      const { data: convAtualizada } = await supabase
        .from("ia_conversas")
        .select("*")
        .eq("id", conversa.id)
        .single();
      conversa = convAtualizada || conversa;
    }

    // 5. Transferir para humano se solicitado
    if (intent.intent === "transferir_humano") {
      await supabase
        .from("ia_conversas")
        .update({
          atendente_assumiu: true,
          intencao_detectada: "transferir_humano",
          ultima_mensagem_at: new Date().toISOString(),
        })
        .eq("id", conversa.id);

      const ctx = conversa?.contexto || [];
      ctx.push({ role: "user", content: mensagem, timestamp: new Date().toISOString() });
      ctx.push({ role: "assistant", content: intent.fastResponse, timestamp: new Date().toISOString() });

      await supabase
        .from("ia_conversas")
        .update({ contexto: ctx.slice(-20) })
        .eq("id", conversa.id);

      await supabase.from("ia_logs").insert({
        telefone,
        mensagem_recebida: mensagem,
        resposta_ia: intent.fastResponse,
        intencao: "transferir_humano",
        modelo_usado: "fast-path",
        tokens_entrada: 0,
        tokens_saida: 0,
        tempo_resposta_ms: 0,
      });

      return new Response(
        JSON.stringify({
          success: true,
          resposta: intent.fastResponse,
          intent: "transferir_humano",
          modelo: "fast-path",
          atendente_assumiu: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Resposta rápida (sem LLM) para intenções simples com alta confiança
    if (intent.fastResponse && intent.confidence > 0.9) {
      const ctx = conversa?.contexto || [];
      ctx.push({ role: "user", content: mensagem, timestamp: new Date().toISOString() });
      ctx.push({ role: "assistant", content: intent.fastResponse, timestamp: new Date().toISOString() });

      await supabase
        .from("ia_conversas")
        .update({
          contexto: ctx.slice(-20),
          intencao_detectada: intent.intent,
          ultima_mensagem_at: new Date().toISOString(),
        })
        .eq("id", conversa.id);

      // Auto-confirmar consulta no banco
      if (intent.intent === "confirmacao_sim" && conversa?.paciente_id) {
        const { data: consultaPendente } = await supabase
          .from("consultas")
          .select("id")
          .eq("paciente_id", conversa.paciente_id)
          .eq("status", "agendada")
          .gte("data_hora_inicio", new Date().toISOString())
          .order("data_hora_inicio", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (consultaPendente) {
          await supabase
            .from("consultas")
            .update({ status: "confirmada", updated_at: new Date().toISOString() })
            .eq("id", consultaPendente.id);
        }
      }

      await supabase.from("ia_logs").insert({
        telefone,
        mensagem_recebida: mensagem,
        resposta_ia: intent.fastResponse,
        intencao: intent.intent,
        modelo_usado: "fast-path",
        tokens_entrada: 0,
        tokens_saida: 0,
        tempo_resposta_ms: 0,
      });

      return new Response(
        JSON.stringify({
          success: true,
          resposta: intent.fastResponse,
          intent: intent.intent,
          modelo: "fast-path",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Buscar TODOS os dados necessários em paralelo
    const queries: Promise<any>[] = [
      supabase.from("procedimentos").select("*").eq("ativo", true),
      supabase.from("dentistas").select("*"),
    ];

    // Dados do paciente se identificado
    let pacienteInfo = null;
    let consultasFuturas = null;
    let historicoConsultas = null;

    if (conversa?.paciente_id) {
      queries.push(
        supabase
          .from("pacientes")
          .select("nome, telefone, email, data_nascimento, observacoes, meses_retorno, tags")
          .eq("id", conversa.paciente_id)
          .single()
      );
      queries.push(
        supabase
          .from("consultas")
          .select("data_hora_inicio, data_hora_fim, status, procedimentos, dentista_id")
          .eq("paciente_id", conversa.paciente_id)
          .gte("data_hora_inicio", new Date().toISOString())
          .in("status", ["agendada", "confirmada"])
          .order("data_hora_inicio", { ascending: true })
          .limit(5)
      );
      queries.push(
        supabase
          .from("consultas")
          .select("data_hora_inicio, status, procedimentos")
          .eq("paciente_id", conversa.paciente_id)
          .eq("status", "realizada")
          .order("data_hora_inicio", { ascending: false })
          .limit(5)
      );
    }

    const results = await Promise.all(queries);
    const procedimentos = results[0].data || [];
    const dentistas = results[1].data || [];

    if (conversa?.paciente_id) {
      pacienteInfo = results[2]?.data || null;

      // Enriquecer consultas futuras com nome do dentista
      const consultasFuturasRaw = results[3]?.data || [];
      consultasFuturas = consultasFuturasRaw.map((c: any) => ({
        ...c,
        dentista_nome: dentistas.find((d: any) => d.id === c.dentista_id)?.nome || "N/A",
      }));

      historicoConsultas = results[4]?.data || [];
    }

    // 8. Selecionar modelo inteligente
    const intentesLite = ["horario", "endereco", "saudacao", "agradecimento"];
    const useLite = intentesLite.includes(intent.intent) && intent.confidence > 0.8;
    const modelo = useLite ? (iaConfig.modelo_lite || iaConfig.modelo_principal) : iaConfig.modelo_principal;

    // 9. Montar prompt com TODOS os dados reais
    const systemPrompt = buildSystemPrompt(
      iaConfig,
      procedimentos,
      iaConfig.horario_funcionamento,
      dentistas,
      pacienteInfo,
      consultasFuturas,
      historicoConsultas
    );

    // 10. Montar mensagens com contexto de conversa
    const contextMessages = (conversa?.contexto || []).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));
    contextMessages.push({ role: "user", content: mensagem });

    // 11. Chamar LLM
    const llmResult = await callLLM(
      iaConfig.api_key,
      modelo,
      systemPrompt,
      contextMessages,
      iaConfig.max_tokens_resposta || 500,
      Number(iaConfig.temperatura) || 0.7
    );

    // 12. VALIDAR RESPOSTA (anti-alucinação)
    const validation = validarResposta(llmResult.content, {
      procedimentos,
      dentistas,
      horarios: iaConfig.horario_funcionamento,
      endereco: iaConfig.endereco || "",
      config: iaConfig,
    });

    let respostaFinal = llmResult.content;

    // Se detectou alucinação, tentar corrigir
    if (!validation.isValid) {
      console.warn("[ia-responder] Alucinacao detectada:", validation.corrections);

      // Refazer chamada com instrução de correção
      const correctionPrompt = `\n\n# CORRECAO NECESSARIA\nSua resposta anterior continha erros:\n${validation.corrections.map((c) => `- ${c}`).join("\n")}\n\nReescreva a resposta usando APENAS os dados fornecidos no prompt do sistema. NAO invente nenhuma informacao.`;

      contextMessages.push({ role: "assistant", content: llmResult.content });
      contextMessages.push({ role: "user", content: correctionPrompt });

      try {
        const retryResult = await callLLM(
          iaConfig.api_key,
          iaConfig.modelo_principal, // Sempre usar modelo principal para correção
          systemPrompt,
          contextMessages.slice(-8), // Contexto menor para correção
          iaConfig.max_tokens_resposta || 500,
          0.3 // Temperatura baixa para correção
        );
        respostaFinal = retryResult.content;

        // Re-validar
        const revalidation = validarResposta(respostaFinal, {
          procedimentos,
          dentistas,
          horarios: iaConfig.horario_funcionamento,
          endereco: iaConfig.endereco || "",
          config: iaConfig,
        });

        if (!revalidation.isValid) {
          // Se ainda alucinando, usar resposta genérica segura
          respostaFinal = "Vou verificar essa informacao com a equipe e retorno para voce em breve! Se preferir, pode ligar diretamente para a clinica.";
        }
      } catch (retryErr) {
        console.error("[ia-responder] Erro no retry de correcao:", retryErr);
        respostaFinal = "Vou verificar essa informacao e retorno em breve! Qualquer duvida, estamos a disposicao.";
      }
    }

    // 13. Salvar contexto atualizado
    const ctx = conversa?.contexto || [];
    ctx.push({ role: "user", content: mensagem, timestamp: new Date().toISOString() });
    ctx.push({ role: "assistant", content: respostaFinal, timestamp: new Date().toISOString() });

    await supabase
      .from("ia_conversas")
      .update({
        contexto: ctx.slice(-20),
        intencao_detectada: intent.intent,
        ultima_mensagem_at: new Date().toISOString(),
      })
      .eq("id", conversa.id);

    // 14. Log completo
    await supabase.from("ia_logs").insert({
      telefone,
      mensagem_recebida: mensagem,
      resposta_ia: respostaFinal,
      intencao: intent.intent,
      modelo_usado: modelo,
      tokens_entrada: llmResult.tokens_in,
      tokens_saida: llmResult.tokens_out,
      tempo_resposta_ms: llmResult.time_ms,
    });

    return new Response(
      JSON.stringify({
        success: true,
        resposta: respostaFinal,
        intent: intent.intent,
        modelo,
        tokens: { in: llmResult.tokens_in, out: llmResult.tokens_out },
        time_ms: llmResult.time_ms,
        validation: validation.isValid ? "ok" : "corrected",
        patient_data_extracted: extractResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[ia-responder] Erro:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Erro interno",
        fallback: "Desculpe, estou com dificuldades tecnicas. Por favor, ligue para a clinica ou tente novamente em alguns minutos.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// CLASSIFICADOR DE INTENÇÃO (sem LLM - rápido e gratuito)
// ============================================================
interface IntentResult {
  intent: string;
  confidence: number;
  fastResponse?: string;
}

function classificarIntencao(mensagem: string): IntentResult {
  const msg = mensagem.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Saudações
  if (/^(oi|ola|hey|bom dia|boa tarde|boa noite|eai|e ai|oie|hello|hi)\b/.test(msg)) {
    return { intent: "saudacao", confidence: 0.95 };
  }

  // Agendamento
  if (/(agendar|marcar|reservar|horario|disponiv|vaga|consulta|atend)/.test(msg)) {
    return { intent: "agendamento", confidence: 0.9 };
  }

  // Cancelamento
  if (/(cancelar|desmarcar|nao vou|nao posso|remarcar|reagendar|trocar.*hora)/.test(msg)) {
    return { intent: "cancelamento", confidence: 0.9 };
  }

  // Confirmação (SIM/NÃO para lembretes)
  if (/^(sim|confirmo|confirmado|pode ser|ok|tudo certo|certo|yes|s)\s*[.!]?$/.test(msg)) {
    return { intent: "confirmacao_sim", confidence: 0.95, fastResponse: "Perfeito! Sua consulta está confirmada. Te esperamos!" };
  }
  if (/^(nao|n|nop|nope|nao posso|nao vou|no)\s*[.!]?$/.test(msg)) {
    return { intent: "confirmacao_nao", confidence: 0.95, fastResponse: "Entendi! Gostaria de reagendar para outro horário?" };
  }

  // Preços
  if (/(preco|valor|custo|quanto custa|tabela|orcamento|pagar|pagamento|pix)/.test(msg)) {
    return { intent: "preco", confidence: 0.85 };
  }

  // Horário de funcionamento
  if (/(horario|funciona|abre|fecha|expediente|atende.*que horas)/.test(msg)) {
    return { intent: "horario", confidence: 0.9 };
  }

  // Endereço/localização
  if (/(endereco|onde fica|localizacao|como chegar|mapa|rua|avenida)/.test(msg)) {
    return { intent: "endereco", confidence: 0.9 };
  }

  // Emergência/Urgência
  if (/(dor|urgente|urgencia|emergencia|sangr|inchou|inchado|quebrou.*dente)/.test(msg)) {
    return { intent: "urgencia", confidence: 0.9 };
  }

  // Procedimentos
  if (/(limpeza|clareamento|canal|implante|aparelho|ortodont|extrac|restaura|protese|faceta)/.test(msg)) {
    return { intent: "procedimento", confidence: 0.85 };
  }

  // Agradecimento
  if (/^(obrigad|valeu|thanks|brigad|agradeço)/.test(msg)) {
    return { intent: "agradecimento", confidence: 0.9, fastResponse: "De nada! Estamos sempre aqui para cuidar do seu sorriso. Qualquer dúvida, é só chamar!" };
  }

  return { intent: "geral", confidence: 0.5 };
}

// ============================================================
// CONSTRUTOR DE PROMPT (montagem modular como a barbearia)
// ============================================================
function buildSystemPrompt(config: any, procedimentos: any[], horarios: any, dentistas: any[]): string {
  const hoje = new Date();
  const diasSemana = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const diaSemana = diasSemana[hoje.getDay()];

  const blocos: string[] = [];

  // Bloco 1: Identidade
  blocos.push(`# IDENTIDADE
Você é a assistente virtual da ${config.nome_clinica || "clínica odontológica"}.
${config.personalidade || "Seja educada, profissional e acolhedora."}
${config.instrucoes_adicionais || ""}`);

  // Bloco 2: Data/Hora
  blocos.push(`# DATA E HORA ATUAL
Hoje é ${diaSemana}, ${hoje.toLocaleDateString("pt-BR")}. Horário: ${hoje.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`);

  // Bloco 3: Horários de funcionamento
  if (horarios) {
    const horarioStr = Object.entries(horarios)
      .map(([dia, h]: [string, any]) => {
        if (!h) return `${dia}: Fechado`;
        return `${dia}: ${h.inicio} - ${h.fim}`;
      })
      .join("\n");
    blocos.push(`# HORÁRIO DE FUNCIONAMENTO\n${horarioStr}`);
  }

  // Bloco 4: Endereço
  if (config.endereco) {
    blocos.push(`# ENDEREÇO\n${config.endereco}`);
  }

  // Bloco 5: Procedimentos e preços
  if (procedimentos.length > 0) {
    const procStr = procedimentos
      .filter((p: any) => p.ativo)
      .map((p: any) => `- ${p.icone || "🦷"} ${p.nome}: R$ ${Number(p.preco).toFixed(2)}`)
      .join("\n");
    blocos.push(`# PROCEDIMENTOS E PREÇOS\n${procStr}`);
  }

  // Bloco 6: Dentistas
  if (dentistas.length > 0) {
    const dentStr = dentistas
      .map((d: any) => `- Dr(a). ${d.nome} (${d.especialidade || "Clínico Geral"}) - CRO: ${d.cro}`)
      .join("\n");
    blocos.push(`# CORPO CLÍNICO\n${dentStr}`);
  }

  // Bloco 7: Regras de comportamento
  blocos.push(`# REGRAS IMPORTANTES
- NUNCA invente informações. Se não souber, diga que vai verificar.
- NUNCA marque consultas diretamente. Oriente o paciente sobre horários disponíveis e peça para confirmar.
- Responda APENAS em português brasileiro.
- Use formatação WhatsApp: *negrito*, _itálico_, ~riscado~.
- Mantenha respostas curtas e diretas (máximo 3 parágrafos).
- Se o paciente demonstrar dor ou urgência, priorize o atendimento e sugira ligar para a clínica.
- Quando o paciente quiser agendar, pergunte: nome, procedimento desejado, data/horário preferido.
- Para cancelamentos, peça o nome e a data da consulta.`);

  return blocos.join("\n\n");
}

// ============================================================
// CHAMADA À LLM (OpenRouter / compatível com OpenAI)
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
      ...messages.slice(-12), // Últimas 12 mensagens para contexto
    ],
    max_tokens: maxTokens,
    temperature,
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
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
    content: data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.",
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
        JSON.stringify({ error: "telefone e mensagem são obrigatórios" }),
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

    // Se atendente assumiu, não responde
    if (conversa?.atendente_assumiu || !conversa?.ia_ativa) {
      return new Response(
        JSON.stringify({ success: false, reason: "Atendente humano assumiu" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Classificar intenção
    const intent = classificarIntencao(mensagem);

    // 4. Resposta rápida (sem LLM) para intenções simples
    if (intent.fastResponse && intent.confidence > 0.9) {
      // Salvar no contexto
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

      // Se confirmou SIM, atualizar consulta
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

      // Log
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

    // 5. Buscar dados para o prompt
    const [{ data: procedimentos }, { data: dentistas }] = await Promise.all([
      supabase.from("procedimentos").select("*").eq("ativo", true),
      supabase.from("dentistas").select("*"),
    ]);

    // 6. Selecionar modelo (lite para perguntas simples, principal para complexas)
    const useLite = ["horario", "endereco", "saudacao"].includes(intent.intent) && intent.confidence > 0.8;
    const modelo = useLite ? iaConfig.modelo_lite : iaConfig.modelo_principal;

    // 7. Montar prompt
    const systemPrompt = buildSystemPrompt(
      iaConfig,
      procedimentos || [],
      iaConfig.horario_funcionamento,
      dentistas || []
    );

    // Adicionar contexto do paciente se disponível
    let patientContext = "";
    if (conversa?.paciente_id) {
      const { data: paciente } = await supabase
        .from("pacientes")
        .select("nome, observacoes, meses_retorno, is_menor_idade, responsavel_nome")
        .eq("id", conversa.paciente_id)
        .single();

      if (paciente) {
        patientContext = `\n\n# PACIENTE IDENTIFICADO\nNome: ${paciente.nome}${paciente.observacoes ? `\nObservações: ${paciente.observacoes}` : ""}${paciente.is_menor_idade ? `\nMenor de idade (Responsável: ${paciente.responsavel_nome})` : ""}`;
      }

      // Consultas futuras
      const { data: consultasFuturas } = await supabase
        .from("consultas")
        .select("data_hora_inicio, status")
        .eq("paciente_id", conversa.paciente_id)
        .gte("data_hora_inicio", new Date().toISOString())
        .in("status", ["agendada", "confirmada"])
        .order("data_hora_inicio", { ascending: true })
        .limit(3);

      if (consultasFuturas && consultasFuturas.length > 0) {
        const consultaStr = consultasFuturas
          .map((c: any) => `- ${new Date(c.data_hora_inicio).toLocaleDateString("pt-BR")} às ${new Date(c.data_hora_inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} (${c.status})`)
          .join("\n");
        patientContext += `\n\nConsultas futuras:\n${consultaStr}`;
      }
    }

    // 8. Montar mensagens com contexto
    const contextMessages = (conversa?.contexto || []).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));
    contextMessages.push({ role: "user", content: mensagem });

    // 9. Chamar LLM
    const llmResult = await callLLM(
      iaConfig.api_key,
      modelo,
      systemPrompt + patientContext,
      contextMessages,
      iaConfig.max_tokens_resposta || 500,
      Number(iaConfig.temperatura) || 0.7
    );

    // 10. Salvar contexto atualizado
    const ctx = conversa?.contexto || [];
    ctx.push({ role: "user", content: mensagem, timestamp: new Date().toISOString() });
    ctx.push({ role: "assistant", content: llmResult.content, timestamp: new Date().toISOString() });

    await supabase
      .from("ia_conversas")
      .update({
        contexto: ctx.slice(-20), // Manter últimas 20 mensagens
        intencao_detectada: intent.intent,
        ultima_mensagem_at: new Date().toISOString(),
      })
      .eq("id", conversa.id);

    // 11. Log
    await supabase.from("ia_logs").insert({
      telefone,
      mensagem_recebida: mensagem,
      resposta_ia: llmResult.content,
      intencao: intent.intent,
      modelo_usado: modelo,
      tokens_entrada: llmResult.tokens_in,
      tokens_saida: llmResult.tokens_out,
      tempo_resposta_ms: llmResult.time_ms,
    });

    return new Response(
      JSON.stringify({
        success: true,
        resposta: llmResult.content,
        intent: intent.intent,
        modelo,
        tokens: { in: llmResult.tokens_in, out: llmResult.tokens_out },
        time_ms: llmResult.time_ms,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[ia-responder] Erro:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Erro interno",
        fallback: "Desculpe, estou com dificuldades técnicas. Por favor, ligue para a clínica ou tente novamente em alguns minutos.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// WORKER DE LEMBRETES INDEPENDENTE
// Roda via cron (pg_cron ou serviço externo)
// 1. Agenda lembretes para consultas futuras
// 2. Envia lembretes que já passaram do horário agendado
// 3. Processa aniversários do dia
// ============================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = {
      lembretes_agendados: 0,
      lembretes_enviados: 0,
      aniversarios_enviados: 0,
      erros: 0,
    };

    // ---- Buscar config WhatsApp ----
    const { data: whatsConfig } = await supabase
      .from("whatsapp_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!whatsConfig?.api_url || !whatsConfig?.instance_token) {
      return new Response(
        JSON.stringify({ success: false, reason: "WhatsApp não configurado", results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Buscar templates ativos ----
    const { data: templates } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .eq("ativo", true);

    const templateMap = new Map((templates || []).map((t: any) => [t.tipo + "_" + t.delay_horas, t]));

    // ============================================================
    // ETAPA 1: Agendar lembretes para consultas futuras (próximos 2 dias)
    // ============================================================
    const agora = new Date();
    const em48h = new Date(agora.getTime() + 48 * 60 * 60 * 1000);

    const { data: consultasFuturas } = await supabase
      .from("consultas")
      .select("*, pacientes(*), dentistas(*)")
      .in("status", ["agendada", "confirmada"])
      .gte("data_hora_inicio", agora.toISOString())
      .lte("data_hora_inicio", em48h.toISOString());

    for (const consulta of consultasFuturas || []) {
      const paciente = (consulta as any).pacientes;
      const dentista = (consulta as any).dentistas;
      if (!paciente) continue;

      const telefone = (paciente.is_menor_idade && paciente.responsavel_telefone)
        ? paciente.responsavel_telefone
        : paciente.telefone;

      // Para cada template de lembrete, verificar se já foi agendado
      for (const template of (templates || []).filter((t: any) => t.tipo === "lembrete_consulta")) {
        const horasAntes = template.delay_horas || 24;
        const dataConsulta = new Date(consulta.data_hora_inicio);
        const dataEnvio = new Date(dataConsulta.getTime() - horasAntes * 60 * 60 * 1000);

        // Não agendar se já passou o horário de envio
        if (dataEnvio < agora) continue;

        // Verificar se já foi agendado
        const { data: existente } = await supabase
          .from("lembretes_agendados")
          .select("id")
          .eq("consulta_id", consulta.id)
          .eq("template_id", template.id)
          .in("status", ["pendente", "enviado"])
          .limit(1);

        if (existente && existente.length > 0) continue;

        // Montar mensagem
        const mensagem = template.mensagem
          .replace(/\{\{nome_paciente\}\}/g, paciente.nome)
          .replace(/\{\{nome\}\}/g, paciente.nome)
          .replace(/\{\{nome_dentista\}\}/g, dentista?.nome || "")
          .replace(/\{\{data_consulta\}\}/g, dataConsulta.toLocaleDateString("pt-BR"))
          .replace(/\{\{hora_consulta\}\}/g, dataConsulta.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }));

        await supabase.from("lembretes_agendados").insert({
          consulta_id: consulta.id,
          paciente_id: paciente.id,
          template_id: template.id,
          telefone,
          mensagem,
          agendado_para: dataEnvio.toISOString(),
          status: "pendente",
        });

        results.lembretes_agendados++;
      }
    }

    // ============================================================
    // ETAPA 2: Enviar lembretes que estão no horário
    // ============================================================
    const { data: lembretesPendentes } = await supabase
      .from("lembretes_agendados")
      .select("*")
      .eq("status", "pendente")
      .lte("agendado_para", agora.toISOString())
      .order("agendado_para", { ascending: true })
      .limit(20);

    for (const lembrete of lembretesPendentes || []) {
      try {
        // Verificar se a consulta ainda existe e não foi cancelada
        if (lembrete.consulta_id) {
          const { data: consulta } = await supabase
            .from("consultas")
            .select("status")
            .eq("id", lembrete.consulta_id)
            .single();

          if (!consulta || consulta.status === "cancelada") {
            await supabase
              .from("lembretes_agendados")
              .update({ status: "cancelado" })
              .eq("id", lembrete.id);
            continue;
          }
        }

        // Enviar via UAZAP
        const sendResponse = await fetch(`${whatsConfig.api_url}/send/text`, {
          method: "POST",
          headers: {
            "token": whatsConfig.instance_token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number: lembrete.telefone,
            text: lembrete.mensagem,
          }),
        });

        if (sendResponse.ok) {
          await supabase
            .from("lembretes_agendados")
            .update({ status: "enviado", enviado_at: agora.toISOString() })
            .eq("id", lembrete.id);

          // Registrar no histórico
          await supabase.from("whatsapp_messages").insert({
            tipo: "lembrete_automatico",
            destinatario: lembrete.telefone,
            mensagem: lembrete.mensagem,
            status: "enviada",
            consulta_id: lembrete.consulta_id,
            paciente_id: lembrete.paciente_id,
          });

          results.lembretes_enviados++;
        } else {
          const tentativas = (lembrete.tentativas || 0) + 1;
          const errorText = await sendResponse.text();
          await supabase
            .from("lembretes_agendados")
            .update({
              tentativas,
              erro_msg: errorText,
              status: tentativas >= 3 ? "erro" : "pendente",
            })
            .eq("id", lembrete.id);
          results.erros++;
        }
      } catch (err: any) {
        results.erros++;
        await supabase
          .from("lembretes_agendados")
          .update({
            tentativas: (lembrete.tentativas || 0) + 1,
            erro_msg: err.message,
          })
          .eq("id", lembrete.id);
      }
    }

    // ============================================================
    // ETAPA 3: Aniversários do dia
    // ============================================================
    if (whatsConfig.parabens_automatico !== false) {
      const templateAniversario = (templates || []).find((t: any) => t.tipo === "aniversario_paciente");

      if (templateAniversario) {
        const day = agora.getDate();
        const month = agora.getMonth() + 1;

        const { data: todosP } = await supabase.from("pacientes").select("*");
        const aniversariantes = (todosP || []).filter((p: any) => {
          if (!p.data_nascimento) return false;
          const d = new Date(p.data_nascimento);
          return d.getUTCDate() === day && (d.getUTCMonth() + 1) === month;
        });

        const todayStart = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).toISOString();

        for (const paciente of aniversariantes) {
          // Já enviou hoje?
          const { data: jEnviou } = await supabase
            .from("whatsapp_messages")
            .select("id")
            .eq("paciente_id", paciente.id)
            .eq("tipo", "aniversario_paciente")
            .gte("created_at", todayStart)
            .limit(1);

          if (jEnviou && jEnviou.length > 0) continue;

          const telefone = (paciente.is_menor_idade && paciente.responsavel_telefone)
            ? paciente.responsavel_telefone
            : paciente.telefone;

          const mensagem = templateAniversario.mensagem
            .replace(/\{\{nome_paciente\}\}/g, paciente.nome)
            .replace(/\{\{nome\}\}/g, paciente.nome);

          try {
            const resp = await fetch(`${whatsConfig.api_url}/send/text`, {
              method: "POST",
              headers: {
                "token": whatsConfig.instance_token,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ number: telefone, text: mensagem }),
            });

            if (resp.ok) {
              await supabase.from("whatsapp_messages").insert({
                tipo: "aniversario_paciente",
                destinatario: telefone,
                mensagem,
                status: "enviada",
                paciente_id: paciente.id,
              });
              results.aniversarios_enviados++;
            }
          } catch {
            results.erros++;
          }
        }
      }
    }

    console.log(`[worker-lembretes] Resultados:`, results);

    return new Response(
      JSON.stringify({ success: true, results, timestamp: agora.toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[worker-lembretes] Erro geral:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

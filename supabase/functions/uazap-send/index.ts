// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; // Revertido para 0.168.0
// @ts-ignore: Deno environment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'; // Adicionado para consistência

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickDelayMs(minSeconds: number, maxSeconds: number) {
  const min = Math.max(0, Math.floor(minSeconds));
  const max = Math.max(min, Math.floor(maxSeconds));
  const seconds = Math.floor(Math.random() * (max - min + 1)) + min;
  return seconds * 1000;
}

serve(async (req: Request) => { // 'req' tipado como Request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, apiUrl, instanceToken, ...payload } = await req.json();

    console.log(`[UAZAP] Action: ${action}`);
    console.log(`[UAZAP] API URL: ${apiUrl}`);

    if (!apiUrl || !instanceToken) {
      return jsonResponse({ error: "API URL e Token são obrigatórios" }, 400);
    }

    const uazapHeaders = {
      token: instanceToken,
      "Content-Type": "application/json",
    };

    if (action === "test") {
      console.log("[UAZAP] Testing connection...");
      const response = await fetch(`${apiUrl}/instance/status`, {
        method: "GET",
        headers: uazapHeaders,
      });

      const responseText = await response.text();
      console.log("[UAZAP] Response status:", response.status);
      console.log("[UAZAP] Response body:", responseText);

      if (!response.ok) {
        console.error("[UAZAP] Connection test failed:", responseText);
        return jsonResponse(
          { success: false, error: `Falha na conexão: ${responseText}` },
          400,
        );
      }

      let data: unknown = null;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }

      console.log("[UAZAP] Connection successful:", data);
      return jsonResponse({ success: true, data });
    }

    if (action === "send-text") {
      const { number, text } = payload as { number?: string; text?: string };

      if (!number || !text) {
        return jsonResponse({ error: "number e text são obrigatórios" }, 400);
      }

      console.log(`[UAZAP] Sending text to: ${number}`);

      const response = await fetch(`${apiUrl}/send/text`, {
        method: "POST",
        headers: uazapHeaders,
        body: JSON.stringify({ number, text }),
      });

      const data = await response.json().catch(async () => ({ raw: await response.text() }));
      console.log("[UAZAP] Text sent response:", data);

      return jsonResponse({ success: response.ok, data }, response.ok ? 200 : 400);
    }

    if (action === "send-image") {
      const { number, base64, caption } = payload as { number?: string; base64?: string; caption?: string };

      if (!number || !base64) {
        return jsonResponse({ error: "number e base64 são obrigatórios para enviar imagem" }, 400);
      }

      console.log(`[UAZAP] Sending image to: ${number}`);

      const response = await fetch(`${apiUrl}/send/image`, {
        method: "POST",
        headers: uazapHeaders,
        body: JSON.stringify({ number, base64, caption }),
      });

      const data = await response.json().catch(async () => ({ raw: await response.text() }));
      console.log("[UAZAP] Image sent response:", data);

      return jsonResponse({ success: response.ok, data }, response.ok ? 200 : 400);
    }

    if (action === "send-menu") {
      const {
        number,
        text,
        choices,
        listButton,
        footerText,
      } = payload as {
        number?: string;
        text?: string;
        choices?: string[];
        listButton?: string;
        footerText?: string;
      };

      if (!number || !text || !Array.isArray(choices) || choices.length === 0) {
        return jsonResponse({ error: "number, text e choices são obrigatórios" }, 400);
      }

      console.log(`[UAZAP] Sending list menu to: ${number}`);

      const response = await fetch(`${apiUrl}/send/menu`, {
        method: "POST",
        headers: uazapHeaders,
        body: JSON.stringify({
          number,
          type: "list",
          text,
          choices,
          listButton: listButton || "Ver opções",
          footerText: footerText || "DentalClinic", // Updated default footer
        }),
      });

      const data = await response.json().catch(async () => ({ raw: await response.text() }));
      console.log("[UAZAP] Menu response:", data);

      return jsonResponse({ success: response.ok, data }, response.ok ? 200 : 400);
    }

    if (action === "send-buttons") {
      const { number, text, choices } = payload as {
        number?: string;
        text?: string;
        choices?: string[];
      };

      if (!number || !text || !Array.isArray(choices) || choices.length === 0) {
        return jsonResponse({ error: "number, text e choices são obrigatórios" }, 400);
      }

      const lines = choices.map((c, idx) => `• ${idx + 1} - ${c}`);
      const finalText = `${text}\n\n${lines.join("\n")}\n\nResponda com o número da opção.`;

      console.log(`[UAZAP] Sending buttons-as-text to: ${number}`);

      const response = await fetch(`${apiUrl}/send/text`, {
        method: "POST",
        headers: uazapHeaders,
        body: JSON.stringify({ number, text: finalText }),
      });

      const data = await response.json().catch(async () => ({ raw: await response.text() }));
      console.log("[UAZAP] Buttons-as-text response:", data);

      return jsonResponse({ success: response.ok, data }, response.ok ? 200 : 400);
    }

    if (action === "create-campaign") {
      const {
        messages,
        delayMin,
        delayMax,
      } = payload as {
        messages?: Array<{ number: string; type?: string; text?: string }>;
        delayMin?: number;
        delayMax?: number;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        return jsonResponse({ error: "messages é obrigatório" }, 400);
      }

      const min = typeof delayMin === "number" ? delayMin : 10;
      const max = typeof delayMax === "number" ? delayMax : 30;

      console.log(`[UAZAP] Starting bulk send for ${messages.length} mensagens (delay ${min}-${max}s)`);

      const run = async () => {
        let sent = 0;
        for (const msg of messages) {
          const number = msg?.number;
          const text = msg?.text;

          if (!number || !text) {
            console.warn("[UAZAP] Skipping invalid message:", msg);
            continue;
          }

          const delayMs = pickDelayMs(min, max);
          console.log(`[UAZAP] Waiting ${delayMs}ms before sending to ${number}`);
          await sleep(delayMs);

          try {
            const response = await fetch(`${apiUrl}/send/text`, {
              method: "POST",
              headers: uazapHeaders,
              body: JSON.stringify({ number, text }),
            });

            const data = await response.json().catch(async () => ({ raw: await response.text() }));
            console.log(`[UAZAP] Bulk send result to ${number}:`, { ok: response.ok, data });

            if (response.ok) sent++;
          } catch (err) {
            console.error(`[UAZAP] Bulk send error to ${number}:`, err);
          }
        }

        console.log(`[UAZAP] Bulk send finished. Sent: ${sent}/${messages.length}`);
      };

      // @ts-ignore: EdgeRuntime is a global in Deno Edge Functions
      EdgeRuntime?.waitUntil?.(run()) ?? run();
      
      return jsonResponse({ success: true, started: true, total: messages.length });
    }

    return jsonResponse({ error: "Ação não reconhecida" }, 400);
  } catch (error) {
    console.error("[UAZAP] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return jsonResponse({ error: errorMessage }, 500);
  }
});
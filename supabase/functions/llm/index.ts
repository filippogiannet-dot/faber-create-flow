import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function readSystemPrompt(): Promise<string> {
  try {
    const promptPath = new URL("../ai-generate/prompt.txt", import.meta.url);
    return await Deno.readTextFile(promptPath);
  } catch (e) {
    console.error("Failed to read prompt.txt:", e);
    return "You are a helpful assistant.";
  }
}

async function getCodeContext(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from("project_files")
    .select("file_path, file_content")
    .eq("project_id", projectId)
    .limit(50);

  if (error) {
    console.error("Error fetching project files:", error);
    return [] as Array<{ file_path: string; content: string }>;
  }

  return (data || []).map((f: any) => ({
    file_path: f.file_path,
    content: (f.file_content || "").slice(0, 4000),
  }));
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });

    const body = await req.json();
    const { projectId, message, stream = false, attachments = [] } = body || {};

    if (!projectId || typeof projectId !== "string") {
      return new Response(JSON.stringify({ error: "projectId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [systemPrompt, codeContext] = await Promise.all([
      readSystemPrompt(),
      getCodeContext(supabase, projectId),
    ]);

    const contextText = `\n\nCurrent codebase files (truncated):\n${JSON.stringify(codeContext, null, 2)}`;

    const messages = [
      { role: "system", content: systemPrompt + contextText },
      { role: "user", content: message as string },
    ];

    if (stream) {
      // For simplicity, streaming is not implemented in this first pass
      return new Response(JSON.stringify({ error: "Streaming is not enabled for this function yet" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        // max_tokens works for gpt-4o-mini (legacy family)
        max_tokens: 1000,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error:", openaiRes.status, errText);
      return new Response(JSON.stringify({ error: "OpenAI request failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await openaiRes.json();
    const assistant = data?.choices?.[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({ success: true, projectId, message, assistant }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("llm function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TTL_MS = 5 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: authErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ALLOWED_NETWORKS = ["bitcoin", "ethereum", "solana"];
    const { action, network, address, data } = await req.json();

    if (action === "read") {
      if (
        !ALLOWED_NETWORKS.includes(String(network)) ||
        typeof address !== "string" || address.length > 128 || !/^[a-zA-Z0-9:_-]+$/.test(address)
      ) {
        return new Response(JSON.stringify({ error: "invalid fields" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: row } = await admin
        .from("wallet_cache")
        .select("data, expires_at")
        .eq("network", network)
        .ilike("address", address)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      return new Response(JSON.stringify(row ?? null), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!network || !address || data === undefined || !ALLOWED_NETWORKS.includes(String(network))) {
      return new Response(JSON.stringify({ error: "invalid fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof address !== "string" || address.length > 128 || !/^[a-zA-Z0-9:_-]+$/.test(address)) {
      return new Response(JSON.stringify({ error: "invalid address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const expires_at = new Date(Date.now() + TTL_MS).toISOString();
    await supabase
      .from("wallet_cache")
      .upsert({ network, address, data, expires_at }, { onConflict: "network,address" });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

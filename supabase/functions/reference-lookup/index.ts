// Narrow, read-only lookups for data that public pages need without exposing
// whole tables: exact-address OFAC matches, a single shared health report by
// its id, and the short recent-checks ticker on the landing page.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const NETWORKS = ["bitcoin", "ethereum", "solana"];
const ADDRESS_RE = /^[a-zA-Z0-9]{20,128}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    switch (body.action) {
      case "sanctions": {
        const address = typeof body.address === "string" ? body.address.trim() : "";
        const network = typeof body.network === "string" ? body.network.toLowerCase() : null;
        if (!ADDRESS_RE.test(address)) return json({ error: "Invalid address" }, 400);
        if (network && !NETWORKS.includes(network)) return json({ error: "Invalid network" }, 400);
        let q = admin
          .from("sanctions_addresses")
          .select("id, address, network, source_list, program, entity_name, date_listed, metadata")
          .ilike("address", address.replace(/[%_]/g, ""))
          .limit(25);
        if (network) q = q.eq("network", network);
        const { data, error } = await q;
        if (error) throw error;
        return json({ hits: data ?? [] });
      }

      case "health_report": {
        const id = typeof body.id === "string" ? body.id : "";
        if (!UUID_RE.test(id)) return json({ error: "Invalid id" }, 400);
        const { data, error } = await admin
          .from("health_reports")
          .select("report, created_at")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return json({ error: "Not found" }, 404);
        return json(data);
      }

      case "recent_checks": {
        const { data, error } = await admin
          .from("public_checks")
          .select("address, network, verdict, risk_score, created_at")
          .order("created_at", { ascending: false })
          .limit(12);
        if (error) throw error;
        return json({ checks: data ?? [] });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("reference-lookup failed:", e);
    return json({ error: "Lookup failed" }, 500);
  }
});

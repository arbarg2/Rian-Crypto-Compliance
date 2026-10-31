import { supabase } from '@/integrations/supabase/client';

export interface SanctionsAddressRow {
  id: string;
  address: string;
  network: string;
  source_list: string;
  program: string | null;
  entity_name: string | null;
  date_listed: string | null;
  metadata: unknown;
}

/** Exact-address OFAC lookup via the backend; tables are not directly readable. */
export async function lookupSanctionsAddress(
  address: string,
  network?: string,
): Promise<{ hits: SanctionsAddressRow[]; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke('reference-lookup', {
    body: { action: 'sanctions', address, network: network?.toLowerCase() },
  });
  if (error) return { hits: [], error };
  return { hits: (data?.hits ?? []) as SanctionsAddressRow[], error: null };
}

export async function fetchHealthReport(id: string) {
  const { data, error } = await supabase.functions.invoke('reference-lookup', {
    body: { action: 'health_report', id },
  });
  if (error || !data?.report) return null;
  return data as { report: unknown; created_at: string };
}

export async function fetchRecentPublicChecks() {
  const { data, error } = await supabase.functions.invoke('reference-lookup', {
    body: { action: 'recent_checks' },
  });
  if (error) return [];
  return (data?.checks ?? []) as Array<{
    address: string;
    network: string;
    verdict: string;
    risk_score: number;
    created_at: string;
  }>;
}

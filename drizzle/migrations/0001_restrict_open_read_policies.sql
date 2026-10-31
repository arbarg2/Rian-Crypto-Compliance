-- Shared health reports and the public checks feed are now served one record at a
-- time (or as a short, column-limited ticker) by a backend function.
DROP POLICY IF EXISTS "Health reports are publicly readable by link" ON public.health_reports;
DROP POLICY IF EXISTS "Anyone can read public checks" ON public.public_checks;
REVOKE SELECT ON public.health_reports FROM anon, authenticated;
REVOKE SELECT ON public.public_checks FROM anon, authenticated;

-- Wallet cache and rulesets are only read by backend functions.
DROP POLICY IF EXISTS "Authenticated users can read wallet cache" ON public.wallet_cache;
DROP POLICY IF EXISTS "Authenticated users read rulesets" ON public.rulesets;
REVOKE SELECT ON public.wallet_cache FROM anon, authenticated;
REVOKE SELECT ON public.rulesets FROM anon, authenticated;

-- Reference screening lists: signed-in users only (public pages use the backend lookup).
DROP POLICY IF EXISTS "Anyone can read malicious addresses" ON public.malicious_addresses;
DROP POLICY IF EXISTS "Anyone can read sanctions" ON public.sanctions_addresses;
REVOKE SELECT ON public.malicious_addresses FROM anon;
REVOKE SELECT ON public.sanctions_addresses FROM anon;
GRANT SELECT ON public.malicious_addresses TO authenticated;
GRANT SELECT ON public.sanctions_addresses TO authenticated;

CREATE POLICY "Signed-in users can read malicious addresses"
  ON public.malicious_addresses FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Signed-in users can read sanctions"
  ON public.sanctions_addresses FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

GRANT ALL ON public.health_reports, public.public_checks, public.wallet_cache,
  public.rulesets, public.malicious_addresses, public.sanctions_addresses TO service_role;
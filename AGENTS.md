# Architecture rules

- Use the shared RiskScoreDisclosure link beside wallet risk scores, pointing to the public methodology disclosure, so attribution stays consistent across views.
- Public pages read sanctions hits, shared health reports and the recent-checks ticker through the reference-lookup edge function; those tables have no anonymous read access, so no one can list them whole.

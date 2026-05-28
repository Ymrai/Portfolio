-- ============================================================
-- Explicit Data API GRANTs
--
-- From October 30, 2026, Supabase will no longer automatically
-- grant table access to the `anon` and `authenticated` roles for
-- new tables in the public schema. This migration makes all
-- required grants explicit so the project is not affected by
-- that breaking change, and to document the intended access model.
--
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run (all statements are idempotent).
-- ============================================================

-- ── Schema usage ─────────────────────────────────────────────
-- Both roles need USAGE on the public schema to call the Data API.

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;


-- ── portfolio_info ───────────────────────────────────────────
-- Read: public site reads via createClient() (anon).
-- Write: admin /info page writes via browser client (anon).
--   RLS should restrict writes to authenticated admin sessions
--   if Supabase Auth is added in future; for now the admin area
--   is protected only by the admin_auth cookie at the app layer.

GRANT SELECT ON TABLE public.portfolio_info TO anon;
GRANT UPDATE ON TABLE public.portfolio_info TO anon;


-- ── projects ─────────────────────────────────────────────────
-- Read: public site and admin list page both use createClient().
-- Write: Server Actions use createServiceClient() (service role).
--   Service role bypasses RLS and needs no explicit grant.
--
-- NOTE: getAllProjects() (admin list) uses the anon client with
--   no status filter. If RLS enforces status='published' for anon,
--   drafts will be invisible in the admin — see queries.ts note.
--   Recommend migrating getAllProjects() to createServiceClient().

GRANT SELECT ON TABLE public.projects TO anon;


-- ── more_projects ────────────────────────────────────────────
-- Read: public site uses createClient() (anon).
-- Write: Server Actions use createServiceClient().
-- Admin list: getAllMoreProjects() correctly uses createServiceClient().

GRANT SELECT ON TABLE public.more_projects TO anon;


-- ── about_me ─────────────────────────────────────────────────
-- Read: public About page uses createClient() (anon).
-- Write: admin /about page writes directly via browser anon client.

GRANT SELECT ON TABLE public.about_me TO anon;
GRANT UPDATE ON TABLE public.about_me TO anon;


-- ── settings ─────────────────────────────────────────────────
-- All access is via createServiceClient() (service role only).
-- RLS is enabled with no policies → anon/authenticated are denied.
-- No grants for anon or authenticated — this is intentional.
-- Service role bypasses RLS automatically; no grant needed.

-- (no GRANT statements for settings)


-- ── Summary of access model ──────────────────────────────────
--
-- Table            anon SELECT  anon UPDATE  service_role
-- ─────────────────────────────────────────────────────────────
-- portfolio_info   ✅           ✅           ✅ (bypasses RLS)
-- projects         ✅           ❌           ✅ (bypasses RLS)
-- more_projects    ✅           ❌           ✅ (bypasses RLS)
-- about_me         ✅           ✅           ✅ (bypasses RLS)
-- settings         ❌           ❌           ✅ (bypasses RLS)
--
-- ── Security Advisor recommendations to check in dashboard ───
--
-- 1. Ensure RLS is ENABLED on all tables (prevents anon from
--    reading/writing rows that policies don't explicitly allow).
--
-- 2. Recommended RLS policies for portfolio_info and about_me
--    (if not already present):
--
--    CREATE POLICY "Public can read portfolio_info"
--      ON public.portfolio_info FOR SELECT TO anon USING (true);
--
--    CREATE POLICY "Public can read about_me"
--      ON public.about_me FOR SELECT TO anon USING (true);
--
--    CREATE POLICY "Public can read published projects"
--      ON public.projects FOR SELECT TO anon
--      USING (status = 'published');
--
--    CREATE POLICY "Public can read published more_projects"
--      ON public.more_projects FOR SELECT TO anon
--      USING (status = 'published');
--
-- 3. The anon UPDATE grants on portfolio_info and about_me are
--    protected only by the admin_auth cookie at the app layer —
--    not by RLS. If stricter security is needed, migrate the
--    admin /about and /info pages to use Server Actions with
--    createServiceClient() and remove the UPDATE grants from anon.

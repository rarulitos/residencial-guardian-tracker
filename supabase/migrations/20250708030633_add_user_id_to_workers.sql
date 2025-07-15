-- Fix foreign key references to use auth.uid() directly instead of profiles table
ALTER TABLE public.billing_periods DROP CONSTRAINT IF EXISTS billing_periods_user_id_fkey;
ALTER TABLE public.workers DROP CONSTRAINT IF EXISTS workers_user_id_fkey;
ALTER TABLE public.exported_reports DROP CONSTRAINT IF EXISTS exported_reports_user_id_fkey;

ALTER TABLE public.groups
ADD COLUMN billing_period_id UUID REFERENCES public.billing_periods(id) ON DELETE CASCADE NOT NULL;

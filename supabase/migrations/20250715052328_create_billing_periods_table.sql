
CREATE TABLE IF NOT EXISTS public.billing_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.billing_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to see their own billing_periods" ON public.billing_periods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create billing_periods for themselves" ON public.billing_periods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own billing_periods" ON public.billing_periods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own billing_periods" ON public.billing_periods
  FOR DELETE USING (auth.uid() = user_id);

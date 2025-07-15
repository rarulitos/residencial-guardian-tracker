-- 1. Create the new 'groups' table
CREATE TABLE public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for the new table
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create policies for 'groups'
CREATE POLICY "Allow users to see their own groups" ON public.groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create groups for themselves" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own groups" ON public.groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own groups" ON public.groups
  FOR DELETE USING (auth.uid() = user_id);


-- 2. Alter the 'workers' table to add a reference to the groups table
ALTER TABLE public.workers
  ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;
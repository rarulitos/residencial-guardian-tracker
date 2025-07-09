-- First, clean up orphaned hospedaje records
DELETE FROM public.worker_hospedaje 
WHERE worker_id NOT IN (SELECT id FROM public.workers);

-- Create a global workers table (independent of periods)
CREATE TABLE public.global_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name, position)
);

-- Enable RLS on global_workers
ALTER TABLE public.global_workers ENABLE ROW LEVEL SECURITY;

-- Create policies for global_workers
CREATE POLICY "Users can view their own global workers" 
ON public.global_workers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own global workers" 
ON public.global_workers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own global workers" 
ON public.global_workers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own global workers" 
ON public.global_workers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Migrate existing data to global_workers
INSERT INTO public.global_workers (user_id, name, position, created_at, updated_at)
SELECT DISTINCT user_id, name, position, MIN(created_at), MAX(updated_at)
FROM public.workers
GROUP BY user_id, name, position
ON CONFLICT (user_id, name, position) DO NOTHING;

-- Create worker_period_assignments table to link workers to periods
CREATE TABLE public.worker_period_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.global_workers(id) ON DELETE CASCADE,
  billing_period_id UUID NOT NULL REFERENCES public.billing_periods(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(worker_id, billing_period_id)
);

-- Enable RLS on worker_period_assignments
ALTER TABLE public.worker_period_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for worker_period_assignments
CREATE POLICY "Users can view their worker assignments" 
ON public.worker_period_assignments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.global_workers 
  WHERE id = worker_period_assignments.worker_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can create their worker assignments" 
ON public.worker_period_assignments 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.global_workers 
  WHERE id = worker_period_assignments.worker_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can delete their worker assignments" 
ON public.worker_period_assignments 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.global_workers 
  WHERE id = worker_period_assignments.worker_id 
  AND user_id = auth.uid()
));

-- Create worker_period_assignments from existing workers
INSERT INTO public.worker_period_assignments (worker_id, billing_period_id, created_at)
SELECT gw.id, w.billing_period_id, w.created_at
FROM public.workers w
JOIN public.global_workers gw ON (
  gw.user_id = w.user_id 
  AND gw.name = w.name 
  AND gw.position = w.position
)
ON CONFLICT (worker_id, billing_period_id) DO NOTHING;

-- Update worker_hospedaje to reference global_workers (create mapping table first)
CREATE TEMP TABLE worker_mapping AS
SELECT w.id as old_id, gw.id as new_id
FROM public.workers w
JOIN public.global_workers gw ON (
  gw.user_id = w.user_id 
  AND gw.name = w.name 
  AND gw.position = w.position
);

-- Update worker_hospedaje
UPDATE public.worker_hospedaje 
SET worker_id = wm.new_id
FROM worker_mapping wm
WHERE worker_hospedaje.worker_id = wm.old_id;

-- Now update the foreign key constraint
ALTER TABLE public.worker_hospedaje 
DROP CONSTRAINT IF EXISTS worker_hospedaje_worker_id_fkey;

ALTER TABLE public.worker_hospedaje 
ADD CONSTRAINT worker_hospedaje_worker_id_fkey 
FOREIGN KEY (worker_id) REFERENCES public.global_workers(id) ON DELETE CASCADE;

-- Update RLS policies for worker_hospedaje
DROP POLICY IF EXISTS "Users can view their workers' hospedaje" ON public.worker_hospedaje;
DROP POLICY IF EXISTS "Users can create hospedaje for their workers" ON public.worker_hospedaje;
DROP POLICY IF EXISTS "Users can update hospedaje for their workers" ON public.worker_hospedaje;
DROP POLICY IF EXISTS "Users can delete hospedaje for their workers" ON public.worker_hospedaje;

CREATE POLICY "Users can view their workers' hospedaje" 
ON public.worker_hospedaje 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.global_workers 
  WHERE id = worker_hospedaje.worker_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can create hospedaje for their workers" 
ON public.worker_hospedaje 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.global_workers 
  WHERE id = worker_hospedaje.worker_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can update hospedaje for their workers" 
ON public.worker_hospedaje 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.global_workers 
  WHERE id = worker_hospedaje.worker_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can delete hospedaje for their workers" 
ON public.worker_hospedaje 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.global_workers 
  WHERE id = worker_hospedaje.worker_id 
  AND user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_global_workers_updated_at
BEFORE UPDATE ON public.global_workers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
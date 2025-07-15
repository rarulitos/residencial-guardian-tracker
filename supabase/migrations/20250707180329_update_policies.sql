-- Create billing_periods table
CREATE TABLE public.billing_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month)
);

-- Create workers table
CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  billing_period_id UUID NOT NULL REFERENCES public.billing_periods(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create worker_hospedaje table
CREATE TABLE public.worker_hospedaje (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  has_hospedaje BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(worker_id, date)
);

-- Create exported_reports table
CREATE TABLE public.exported_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  billing_period_id UUID NOT NULL REFERENCES public.billing_periods(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  export_type TEXT NOT NULL,
  file_data BYTEA,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.billing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_hospedaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exported_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for billing_periods
CREATE POLICY "Users can view their own billing periods" 
ON public.billing_periods 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own billing periods" 
ON public.billing_periods 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own billing periods" 
ON public.billing_periods 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own billing periods" 
ON public.billing_periods 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for workers
CREATE POLICY "Users can view their own workers" 
ON public.workers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workers" 
ON public.workers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workers" 
ON public.workers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workers" 
ON public.workers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for worker_hospedaje
CREATE POLICY "Users can view their workers' hospedaje" 
ON public.worker_hospedaje 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.workers 
    WHERE workers.id = worker_hospedaje.worker_id 
    AND workers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create hospedaje for their workers" 
ON public.worker_hospedaje 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workers 
    WHERE workers.id = worker_hospedaje.worker_id 
    AND workers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update hospedaje for their workers" 
ON public.worker_hospedaje 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.workers 
    WHERE workers.id = worker_hospedaje.worker_id 
    AND workers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete hospedaje for their workers" 
ON public.worker_hospedaje 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.workers 
    WHERE workers.id = worker_hospedaje.worker_id 
    AND workers.user_id = auth.uid()
  )
);

-- Create RLS policies for exported_reports
CREATE POLICY "Users can view their own exported reports" 
ON public.exported_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exported reports" 
ON public.exported_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exported reports" 
ON public.exported_reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_billing_periods_updated_at
  BEFORE UPDATE ON public.billing_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_worker_hospedaje_updated_at
  BEFORE UPDATE ON public.worker_hospedaje
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
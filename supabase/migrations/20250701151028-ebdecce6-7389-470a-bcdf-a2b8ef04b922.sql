
-- Create weight_entries table to properly store weight data
CREATE TABLE public.weight_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  weight DOUBLE PRECISION NOT NULL,
  entry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

-- Add Row Level Security (RLS) for weight entries
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for weight entries
CREATE POLICY "Users can view their own weight entries" 
  ON public.weight_entries 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weight entries" 
  ON public.weight_entries 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight entries" 
  ON public.weight_entries 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight entries" 
  ON public.weight_entries 
  FOR DELETE 
  USING (auth.uid() = user_id);

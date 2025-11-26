-- Create SkillMuse lessons table (separate from existing lessons)
CREATE TABLE public.skillmuse_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  one_line_summary TEXT NOT NULL,
  key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  flow_nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  flashcards JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.skillmuse_lessons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own skillmuse lessons"
ON public.skillmuse_lessons
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own skillmuse lessons"
ON public.skillmuse_lessons
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skillmuse lessons"
ON public.skillmuse_lessons
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skillmuse lessons"
ON public.skillmuse_lessons
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add foreign key constraint
ALTER TABLE public.skillmuse_lessons
ADD CONSTRAINT skillmuse_lessons_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_skillmuse_lessons_updated_at
BEFORE UPDATE ON public.skillmuse_lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
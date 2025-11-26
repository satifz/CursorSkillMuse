-- Create User table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create difficulty enum
CREATE TYPE public.difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create source type enum
CREATE TYPE public.source_type AS ENUM ('url', 'text');

-- Create Lesson table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  source_type source_type NOT NULL,
  source_value TEXT NOT NULL,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  visual_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  quiz_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  estimated_time_minutes INTEGER DEFAULT 10,
  difficulty difficulty_level DEFAULT 'beginner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create QuizResult table
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  answers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lessons updated_at
CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Create policies for users table (public access for MVP with demo user)
CREATE POLICY "Allow all operations on users"
ON public.users
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for lessons table
CREATE POLICY "Allow all operations on lessons"
ON public.lessons
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for quiz_results table
CREATE POLICY "Allow all operations on quiz_results"
ON public.quiz_results
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON public.lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON public.lessons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_lesson_id ON public.quiz_results(lesson_id);

-- Insert demo user with a proper UUID
INSERT INTO public.users (id, email, name)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'demo@skillmuse.com', 'Demo User')
ON CONFLICT (id) DO NOTHING;
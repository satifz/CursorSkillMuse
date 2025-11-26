-- Fix critical RLS security issues
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on lessons" ON public.lessons;
DROP POLICY IF EXISTS "Allow all operations on quiz_results" ON public.quiz_results;
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;

-- Create secure RLS policies for lessons table
CREATE POLICY "Users can view their own lessons"
ON public.lessons
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lessons"
ON public.lessons
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lessons"
ON public.lessons
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lessons"
ON public.lessons
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create secure RLS policies for quiz_results table
CREATE POLICY "Users can view their own quiz results"
ON public.quiz_results
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz results"
ON public.quiz_results
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz results"
ON public.quiz_results
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiz results"
ON public.quiz_results
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create secure RLS policies for users table
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add proper foreign key constraint to lessons table
ALTER TABLE public.lessons
DROP CONSTRAINT IF EXISTS lessons_user_id_fkey;

ALTER TABLE public.lessons
ADD CONSTRAINT lessons_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add proper foreign key constraint to quiz_results table
ALTER TABLE public.quiz_results
DROP CONSTRAINT IF EXISTS quiz_results_user_id_fkey;

ALTER TABLE public.quiz_results
ADD CONSTRAINT quiz_results_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;
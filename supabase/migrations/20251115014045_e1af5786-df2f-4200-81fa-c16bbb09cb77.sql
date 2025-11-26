-- COMPREHENSIVE RLS AND FOREIGN KEY FIX MIGRATION

-- 1. VERIFY AND FIX FOREIGN KEY CONSTRAINTS with ON DELETE CASCADE
-- Drop existing foreign key constraints if they exist
ALTER TABLE public.lessons
DROP CONSTRAINT IF EXISTS lessons_user_id_fkey;

ALTER TABLE public.quiz_results
DROP CONSTRAINT IF EXISTS quiz_results_user_id_fkey;

ALTER TABLE public.skillmuse_lessons
DROP CONSTRAINT IF EXISTS skillmuse_lessons_user_id_fkey;

-- Add proper foreign key constraints with ON DELETE CASCADE
ALTER TABLE public.lessons
ADD CONSTRAINT lessons_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.quiz_results
ADD CONSTRAINT quiz_results_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.skillmuse_lessons
ADD CONSTRAINT skillmuse_lessons_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 2. VERIFY RLS IS ENABLED ON ALL USER TABLES
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skillmuse_lessons ENABLE ROW LEVEL SECURITY;

-- 3. DROP ALL EXISTING POLICIES TO START FRESH
DROP POLICY IF EXISTS "Users can view their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can create their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can update their own lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can delete their own lessons" ON public.lessons;

DROP POLICY IF EXISTS "Users can view their own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can create their own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can update their own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can delete their own quiz results" ON public.quiz_results;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view their own skillmuse lessons" ON public.skillmuse_lessons;
DROP POLICY IF EXISTS "Users can create their own skillmuse lessons" ON public.skillmuse_lessons;
DROP POLICY IF EXISTS "Users can update their own skillmuse lessons" ON public.skillmuse_lessons;
DROP POLICY IF EXISTS "Users can delete their own skillmuse lessons" ON public.skillmuse_lessons;

-- 4. CREATE SECURE RLS POLICIES FOR LESSONS TABLE
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

-- 5. CREATE SECURE RLS POLICIES FOR QUIZ_RESULTS TABLE
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

-- 6. CREATE SECURE RLS POLICIES FOR USERS TABLE
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

-- 7. CREATE SECURE RLS POLICIES FOR SKILLMUSE_LESSONS TABLE
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
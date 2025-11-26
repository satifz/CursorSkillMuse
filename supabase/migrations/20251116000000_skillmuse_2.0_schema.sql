-- SkillMuse 2.0: Skill-Based Learning Platform Schema
-- This migration transforms the platform from article-centric to skill-based

-- Create content type enum (expanded from source_type)
CREATE TYPE public.content_type AS ENUM ('article', 'pdf', 'youtube', 'notes', 'url');

-- Create group member role enum
CREATE TYPE public.group_role AS ENUM ('admin', 'member');

-- Create Skills table (core entity)
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  description TEXT,
  difficulty_level public.difficulty_level DEFAULT 'beginner',
  learning_outcomes JSONB DEFAULT '[]'::jsonb, -- AI generated learning outcomes
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create SkillContent table (content sources for skills)
CREATE TABLE IF NOT EXISTS public.skill_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  content_type public.content_type NOT NULL,
  source_value TEXT NOT NULL, -- URL, text, or file reference
  extracted_text TEXT, -- Clean AI-ready text
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create SkillLessons table (AI-generated lessons from content)
CREATE TABLE IF NOT EXISTS public.skill_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.skill_content(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  learning_outcomes JSONB DEFAULT '[]'::jsonb,
  lesson_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- Full lesson structure (summary, slides, quiz)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create Groups table (for group learning mode)
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  description TEXT,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create GroupMembers table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.group_role DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create UserProgress table (track learning progress)
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.skill_lessons(id) ON DELETE CASCADE,
  quiz_score INTEGER, -- Score out of 100
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id) -- One progress record per user per lesson
);

-- Create TrainerSpaces table (for trainer mode)
CREATE TABLE IF NOT EXISTS public.trainer_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_name TEXT NOT NULL,
  description TEXT,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create TrainerSpaceSkills table (skills in a trainer space)
CREATE TABLE IF NOT EXISTS public.trainer_space_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_space_id UUID NOT NULL REFERENCES public.trainer_spaces(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trainer_space_id, skill_id)
);

-- Create TrainerSpaceTrainees table (trainees in a trainer space)
CREATE TABLE IF NOT EXISTS public.trainer_space_trainees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_space_id UUID NOT NULL REFERENCES public.trainer_spaces(id) ON DELETE CASCADE,
  trainee_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  UNIQUE(trainer_space_id, trainee_user_id)
);

-- Create triggers for updated_at
CREATE TRIGGER update_skills_updated_at
BEFORE UPDATE ON public.skills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_skill_lessons_updated_at
BEFORE UPDATE ON public.skill_lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trainer_spaces_updated_at
BEFORE UPDATE ON public.trainer_spaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_space_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_space_trainees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Skills
CREATE POLICY "Users can view all skills"
ON public.skills FOR SELECT
USING (true);

CREATE POLICY "Users can create their own skills"
ON public.skills FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can update their own skills"
ON public.skills FOR UPDATE
USING (auth.uid() = created_by_user_id)
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can delete their own skills"
ON public.skills FOR DELETE
USING (auth.uid() = created_by_user_id);

-- RLS Policies for SkillContent
CREATE POLICY "Users can view all skill content"
ON public.skill_content FOR SELECT
USING (true);

CREATE POLICY "Users can create skill content"
ON public.skill_content FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can update their own skill content"
ON public.skill_content FOR UPDATE
USING (auth.uid() = created_by_user_id)
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can delete their own skill content"
ON public.skill_content FOR DELETE
USING (auth.uid() = created_by_user_id);

-- RLS Policies for SkillLessons
CREATE POLICY "Users can view all skill lessons"
ON public.skill_lessons FOR SELECT
USING (true);

CREATE POLICY "Users can create skill lessons"
ON public.skill_lessons FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update skill lessons"
ON public.skill_lessons FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete skill lessons"
ON public.skill_lessons FOR DELETE
USING (true);

-- RLS Policies for Groups
CREATE POLICY "Users can view all groups"
ON public.groups FOR SELECT
USING (true);

CREATE POLICY "Users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Group admins can update groups"
ON public.groups FOR UPDATE
USING (
  auth.uid() = created_by_user_id OR
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = groups.id
    AND user_id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = created_by_user_id OR
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = groups.id
    AND user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Group creators can delete groups"
ON public.groups FOR DELETE
USING (auth.uid() = created_by_user_id);

-- RLS Policies for GroupMembers
CREATE POLICY "Users can view group members"
ON public.group_members FOR SELECT
USING (true);

CREATE POLICY "Group admins can add members"
ON public.group_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = group_members.group_id
    AND (created_by_user_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM public.group_members gm
           WHERE gm.group_id = group_members.group_id
           AND gm.user_id = auth.uid()
           AND gm.role = 'admin'
         ))
  )
);

CREATE POLICY "Users can join groups themselves"
ON public.group_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group admins can update members"
ON public.group_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = group_members.group_id
    AND (created_by_user_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM public.group_members gm
           WHERE gm.group_id = group_members.group_id
           AND gm.user_id = auth.uid()
           AND gm.role = 'admin'
         ))
  )
);

CREATE POLICY "Users can leave groups"
ON public.group_members FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = group_members.group_id
    AND (created_by_user_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM public.group_members gm
           WHERE gm.group_id = group_members.group_id
           AND gm.user_id = auth.uid()
           AND gm.role = 'admin'
         ))
  )
);

-- RLS Policies for UserProgress
CREATE POLICY "Users can view their own progress"
ON public.user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view progress in their trainer spaces"
ON public.user_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trainer_space_trainees tst
    JOIN public.trainer_space_skills tss ON tss.trainer_space_id = tst.trainer_space_id
    WHERE tst.trainee_user_id = auth.uid()
    AND tss.skill_id = user_progress.skill_id
  )
);

CREATE POLICY "Users can create their own progress"
ON public.user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_progress FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for TrainerSpaces
CREATE POLICY "Users can view trainer spaces they're part of"
ON public.trainer_spaces FOR SELECT
USING (
  auth.uid() = created_by_user_id OR
  EXISTS (
    SELECT 1 FROM public.trainer_space_trainees
    WHERE trainer_space_id = trainer_spaces.id
    AND trainee_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create trainer spaces"
ON public.trainer_spaces FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Trainers can update their spaces"
ON public.trainer_spaces FOR UPDATE
USING (auth.uid() = created_by_user_id)
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Trainers can delete their spaces"
ON public.trainer_spaces FOR DELETE
USING (auth.uid() = created_by_user_id);

-- RLS Policies for TrainerSpaceSkills
CREATE POLICY "Users can view skills in their trainer spaces"
ON public.trainer_space_skills FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trainer_spaces
    WHERE id = trainer_space_skills.trainer_space_id
    AND (created_by_user_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM public.trainer_space_trainees
           WHERE trainer_space_id = trainer_space_skills.trainer_space_id
           AND trainee_user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Trainers can add skills to their spaces"
ON public.trainer_space_skills FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trainer_spaces
    WHERE id = trainer_space_skills.trainer_space_id
    AND created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Trainers can remove skills from their spaces"
ON public.trainer_space_skills FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.trainer_spaces
    WHERE id = trainer_space_skills.trainer_space_id
    AND created_by_user_id = auth.uid()
  )
);

-- RLS Policies for TrainerSpaceTrainees
CREATE POLICY "Users can view trainees in their trainer spaces"
ON public.trainer_space_trainees FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trainer_spaces
    WHERE id = trainer_space_trainees.trainer_space_id
    AND (created_by_user_id = auth.uid() OR
         trainee_user_id = auth.uid())
  )
);

CREATE POLICY "Trainers can add trainees"
ON public.trainer_space_trainees FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trainer_spaces
    WHERE id = trainer_space_trainees.trainer_space_id
    AND created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Trainers can update trainee status"
ON public.trainer_space_trainees FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.trainer_spaces
    WHERE id = trainer_space_trainees.trainer_space_id
    AND created_by_user_id = auth.uid()
  )
);

CREATE POLICY "Trainers can remove trainees"
ON public.trainer_space_trainees FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.trainer_spaces
    WHERE id = trainer_space_trainees.trainer_space_id
    AND created_by_user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_skills_created_by_user_id ON public.skills(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_skills_created_at ON public.skills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_content_skill_id ON public.skill_content(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_content_created_by_user_id ON public.skill_content(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_skill_lessons_skill_id ON public.skill_lessons(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_lessons_content_id ON public.skill_lessons(content_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_skill_id ON public.user_progress(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson_id ON public.user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_trainer_spaces_created_by_user_id ON public.trainer_spaces(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_space_skills_trainer_space_id ON public.trainer_space_skills(trainer_space_id);
CREATE INDEX IF NOT EXISTS idx_trainer_space_skills_skill_id ON public.trainer_space_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_trainer_space_trainees_trainer_space_id ON public.trainer_space_trainees(trainer_space_id);
CREATE INDEX IF NOT EXISTS idx_trainer_space_trainees_trainee_user_id ON public.trainer_space_trainees(trainee_user_id);


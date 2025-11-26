import { supabase } from "@/integrations/supabase/client";
import { SkillMuseLesson } from "@/types/skillmuse";

export async function processUrl(url: string): Promise<SkillMuseLesson> {
  const { data, error } = await supabase.functions.invoke('skillmuse-process-url', {
    body: { url },
  });

  if (error) throw error;
  if (!data?.lesson) throw new Error('No lesson data returned');

  return data.lesson;
}

export async function getLessonsList(page = 1, limit = 10): Promise<{
  lessons: Array<Pick<SkillMuseLesson, 'id' | 'url' | 'title' | 'oneLineSummary' | 'createdAt'>>;
  page: number;
  total: number;
}> {
  const { data, error } = await supabase.functions.invoke(`skillmuse-lessons-list?page=${page}&limit=${limit}`);

  if (error) throw error;
  return data;
}

export async function getLessonDetail(id: string): Promise<SkillMuseLesson> {
  const { data, error } = await supabase.functions.invoke(`skillmuse-lesson-detail?id=${id}`);

  if (error) throw error;
  if (!data?.lesson) throw new Error('Lesson not found');

  return data.lesson;
}

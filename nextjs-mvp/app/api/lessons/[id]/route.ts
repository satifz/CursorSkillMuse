import { NextRequest, NextResponse } from 'next/server';
import { lessonStorage } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[GET /api/lessons/[id]] Fetching lesson:', params.id);
  try {
    const lesson = lessonStorage.getLessonById(params.id);
    
    if (!lesson) {
      console.error('[GET /api/lessons/[id]] Lesson not found:', params.id);
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    console.log('[GET /api/lessons/[id]] Lesson found:', {
      id: lesson.id,
      skill_name: lesson.skill_name,
      slides_count: lesson.visual.slides.length,
      questions_count: lesson.quiz.questions.length
    });
    return NextResponse.json(lesson, { status: 200 });
  } catch (error) {
    console.error('[GET /api/lessons/[id]] Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}


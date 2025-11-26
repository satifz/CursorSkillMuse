import { NextRequest, NextResponse } from 'next/server';
import { lessonStorage } from '@/lib/storage';

// GET /api/skills/[id]/lessons - Get all lessons for a skill
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[GET /api/skills/[id]/lessons] Fetching lessons for skill:', params.id);
  try {
    const lessons = lessonStorage.getLessonsBySkillId(params.id);
    console.log('[GET /api/skills/[id]/lessons] Found', lessons.length, 'lessons');
    return NextResponse.json(lessons, { status: 200 });
  } catch (error) {
    console.error('[GET /api/skills/[id]/lessons] Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}


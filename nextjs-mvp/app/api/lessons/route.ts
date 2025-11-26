import { NextResponse } from 'next/server';
import { lessonStorage } from '@/lib/storage';

export async function GET() {
  console.log('[GET /api/lessons] Fetching all lessons');
  try {
    const lessons = lessonStorage.getAllLessons();
    console.log('[GET /api/lessons] Found', lessons.length, 'lessons');
    return NextResponse.json(lessons, { status: 200 });
  } catch (error) {
    console.error('[GET /api/lessons] Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}


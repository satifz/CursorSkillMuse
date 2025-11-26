import { NextRequest, NextResponse } from 'next/server';
import { contentStorage } from '@/lib/content-storage';

// GET /api/skills/[id]/content-list - Get all content for a skill
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[GET /api/skills/[id]/content-list] Fetching content for skill:', params.id);
  try {
    const content = contentStorage.getContentBySkillId(params.id);
    console.log('[GET /api/skills/[id]/content-list] Found', content.length, 'content items');
    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    console.error('[GET /api/skills/[id]/content-list] Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}


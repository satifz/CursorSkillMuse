import { NextRequest, NextResponse } from 'next/server';
import { skillStorage } from '@/lib/skill-storage';

// GET /api/skills/[id] - Get a single skill
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[GET /api/skills/[id]] Fetching skill:', params.id);
  try {
    const skill = skillStorage.getSkillById(params.id);
    
    if (!skill) {
      console.error('[GET /api/skills/[id]] Skill not found:', params.id);
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    console.log('[GET /api/skills/[id]] Skill found:', {
      id: skill.id,
      skill_name: skill.skill_name
    });
    return NextResponse.json(skill, { status: 200 });
  } catch (error) {
    console.error('[GET /api/skills/[id]] Error fetching skill:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill' },
      { status: 500 }
    );
  }
}


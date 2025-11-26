import { NextRequest, NextResponse } from 'next/server';
import { skillStorage } from '@/lib/skill-storage';

const DEMO_USER_ID = "demo-user-1";

// GET /api/skills - List all skills
export async function GET() {
  console.log('[GET /api/skills] Fetching all skills');
  try {
    const skills = skillStorage.getAllSkills();
    console.log('[GET /api/skills] Found', skills.length, 'skills');
    return NextResponse.json(skills, { status: 200 });
  } catch (error) {
    console.error('[GET /api/skills] Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

// POST /api/skills - Create a new skill
export async function POST(request: NextRequest) {
  console.log('[POST /api/skills] Request received');
  
  try {
    const body = await request.json();
    console.log('[POST /api/skills] Incoming body:', body);

    const { skill_name, description, difficulty } = body;

    if (!skill_name || skill_name.trim() === '') {
      console.error('[POST /api/skills] Missing skill_name');
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      );
    }

    const skill = {
      id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: DEMO_USER_ID,
      skill_name: skill_name.trim(),
      description: description?.trim() || '',
      difficulty: difficulty || 'beginner',
      createdAt: new Date().toISOString()
    };

    console.log('[POST /api/skills] Skill object created, ID:', skill.id);

    // Save to storage
    console.log('[POST /api/skills] Saving skill to storage...');
    skillStorage.saveSkill(skill);
    console.log('[POST /api/skills] Skill saved successfully');

    console.log('[POST /api/skills] Returning skill to client');
    return NextResponse.json(skill, { status: 200 });
  } catch (error) {
    console.error('[POST /api/skills] SERVER ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: "SERVER_ERROR", 
        message: "Skill creation failed",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}


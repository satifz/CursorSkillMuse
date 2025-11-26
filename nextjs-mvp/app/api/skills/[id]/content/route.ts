import { NextRequest, NextResponse } from 'next/server';
import { generateLesson } from '@/lib/openai';
import { extractTextFromUrl } from '@/lib/text-extractor';
import { lessonStorage } from '@/lib/storage';
import { skillStorage } from '@/lib/skill-storage';
import { contentStorage } from '@/lib/content-storage';
import { SkillLesson, SkillContent } from '@/types/lesson';

const DEMO_USER_ID = "demo-user-1";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[POST /api/skills/[id]/content] Request received for skill:', params.id);
  
  try {
    const body = await request.json();
    console.log('[POST /api/skills/[id]/content] Incoming body:', {
      sourceType: body.sourceType,
      sourceValueLength: body.sourceValue?.length || 0
    });

    const { sourceType, sourceValue } = body;

    if (!sourceValue || sourceValue.trim() === '') {
      console.error('[POST /api/skills/[id]/content] Missing sourceValue');
      return NextResponse.json(
        { error: 'Source value (URL or text) is required' },
        { status: 400 }
      );
    }

    // Verify skill exists
    const skill = skillStorage.getSkillById(params.id);
    if (!skill) {
      console.error('[POST /api/skills/[id]/content] Skill not found:', params.id);
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Extract text based on source type
    let extractedText = '';
    
    if (sourceType === 'url') {
      console.log('[POST /api/skills/[id]/content] Processing URL:', sourceValue);
      // Validate URL
      try {
        const url = new URL(sourceValue);
        if (!['http:', 'https:'].includes(url.protocol)) {
          console.error('[POST /api/skills/[id]/content] Invalid URL protocol');
          return NextResponse.json(
            { error: 'Only HTTP/HTTPS URLs are allowed' },
            { status: 400 }
          );
        }
      } catch {
        console.error('[POST /api/skills/[id]/content] Invalid URL format');
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }

      // Fetch and extract text from URL
      console.log('[POST /api/skills/[id]/content] Fetching text from URL...');
      extractedText = await extractTextFromUrl(sourceValue);
      console.log('[POST /api/skills/[id]/content] Text extracted, length:', extractedText.length);
    } else {
      // Use raw text directly
      console.log('[POST /api/skills/[id]/content] Using raw text input');
      extractedText = sourceValue.trim();
    }

    console.log('[POST /api/skills/[id]/content] Extracted text preview (first 200 chars):', extractedText.substring(0, 200));

    if (!extractedText || extractedText.length < 100) {
      console.error('[POST /api/skills/[id]/content] Content too short:', extractedText.length);
      return NextResponse.json(
        { error: 'Content is too short. Please provide more content (at least 100 characters).' },
        { status: 400 }
      );
    }

    // Save content first
    console.log('[POST /api/skills/[id]/content] Saving content to storage...');
    const content: SkillContent = {
      id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      skillId: params.id,
      sourceType,
      sourceValue: sourceValue.trim(),
      extractedText,
      createdAt: new Date().toISOString()
    };
    contentStorage.saveContent(content);
    console.log('[POST /api/skills/[id]/content] Content saved:', content.id);

    // Generate lesson using OpenAI (or mock fallback)
    console.log('[POST /api/skills/[id]/content] Calling generateLesson with skill name:', skill.skill_name);
    const lessonData = await generateLesson(extractedText, skill.skill_name);
    console.log('[POST /api/skills/[id]/content] Lesson data received:', {
      skillName: lessonData.skillName,
      learningOutcomes_count: lessonData.learningOutcomes.length,
      slides_count: lessonData.visual.slides.length,
      questions_count: lessonData.quiz.questions.length
    });

    // Create lesson object linked to skill
    const lesson: SkillLesson = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      skillId: params.id,
      userId: DEMO_USER_ID,
      skillName: lessonData.skillName,
      shortDescription: lessonData.shortDescription,
      learningOutcomes: lessonData.learningOutcomes,
      summary: lessonData.summary,
      visual: lessonData.visual,
      quiz: lessonData.quiz,
      createdAt: new Date().toISOString()
    };

    console.log('[POST /api/skills/[id]/content] Lesson object created, ID:', lesson.id);

    // Save to storage
    console.log('[POST /api/skills/[id]/content] Saving lesson to storage...');
    lessonStorage.saveLesson(lesson);
    console.log('[POST /api/skills/[id]/content] Lesson saved successfully');

    // Verify it was saved
    const savedLesson = lessonStorage.getLessonById(lesson.id);
    if (!savedLesson) {
      console.error('[POST /api/skills/[id]/content] WARNING: Lesson was not found in storage after saving!');
    } else {
      console.log('[POST /api/skills/[id]/content] Verified lesson in storage');
    }

    console.log('[POST /api/skills/[id]/content] Returning lesson to client');
    return NextResponse.json(lesson, { status: 200 });
  } catch (error) {
    console.error('[POST /api/skills/[id]/content] SERVER ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[POST /api/skills/[id]/content] Error message:', errorMessage);
    console.error('[POST /api/skills/[id]/content] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: "SERVER_ERROR", 
        message: "Lesson generation failed",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}


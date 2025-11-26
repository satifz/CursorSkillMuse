import { NextRequest, NextResponse } from 'next/server';
import { generateLesson } from '@/lib/openai';
import { extractTextFromUrl } from '@/lib/text-extractor';
import { lessonStorage } from '@/lib/storage';
import { LessonInput, SkillLesson } from '@/types/lesson';

const DEMO_USER_ID = "demo-user-1";

export async function POST(request: NextRequest) {
  console.log('[POST /api/lessons/generate] Request received');
  
  try {
    const body: LessonInput = await request.json();
    console.log('[POST /api/lessons/generate] Incoming body:', {
      userGoal: body.userGoal,
      sourceType: body.sourceType,
      sourceValueLength: body.sourceValue?.length || 0
    });

    const { userGoal, sourceType, sourceValue } = body;

    if (!sourceValue || sourceValue.trim() === '') {
      console.error('[POST /api/lessons/generate] Missing sourceValue');
      return NextResponse.json(
        { error: 'Source value (URL or text) is required' },
        { status: 400 }
      );
    }

    // Extract text based on source type
    let contentText = '';
    
    if (sourceType === 'url') {
      console.log('[POST /api/lessons/generate] Processing URL:', sourceValue);
      // Validate URL
      try {
        const url = new URL(sourceValue);
        if (!['http:', 'https:'].includes(url.protocol)) {
          console.error('[POST /api/lessons/generate] Invalid URL protocol');
          return NextResponse.json(
            { error: 'Only HTTP/HTTPS URLs are allowed' },
            { status: 400 }
          );
        }
      } catch {
        console.error('[POST /api/lessons/generate] Invalid URL format');
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }

      // Fetch and extract text from URL
      console.log('[POST /api/lessons/generate] Fetching text from URL...');
      contentText = await extractTextFromUrl(sourceValue);
      console.log('[POST /api/lessons/generate] Text extracted, length:', contentText.length);
    } else {
      // Use raw text directly
      console.log('[POST /api/lessons/generate] Using raw text input');
      contentText = sourceValue.trim();
    }

    console.log('[POST /api/lessons/generate] Content text preview (first 200 chars):', contentText.substring(0, 200));

    if (!contentText || contentText.length < 100) {
      console.error('[POST /api/lessons/generate] Content too short:', contentText.length);
      return NextResponse.json(
        { error: 'Content is too short. Please provide more content (at least 100 characters).' },
        { status: 400 }
      );
    }

    // Generate lesson using OpenAI (or mock fallback)
    console.log('[POST /api/lessons/generate] Calling generateLesson...');
    const lessonData = await generateLesson(contentText, userGoal);
    console.log('[POST /api/lessons/generate] Lesson data received:', {
      skillName: lessonData.skillName,
      learningOutcomes_count: lessonData.learningOutcomes.length,
      slides_count: lessonData.visual.slides.length,
      questions_count: lessonData.quiz.questions.length
    });

    // Create lesson object
    const lesson = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: DEMO_USER_ID,
      skill_name: lessonData.skill_name,
      short_description: lessonData.short_description,
      learning_outcomes: lessonData.learning_outcomes,
      summary: lessonData.summary,
      visual: lessonData.visual,
      quiz: lessonData.quiz,
      source: {
        type: sourceType,
        value: sourceValue
      },
      createdAt: new Date().toISOString()
    };

    console.log('[POST /api/lessons/generate] Lesson object created, ID:', lesson.id);

    // Save to storage
    console.log('[POST /api/lessons/generate] Saving lesson to storage...');
    lessonStorage.saveLesson(lesson);
    console.log('[POST /api/lessons/generate] Lesson saved successfully');

    // Verify it was saved
    const savedLesson = lessonStorage.getLessonById(lesson.id);
    if (!savedLesson) {
      console.error('[POST /api/lessons/generate] WARNING: Lesson was not found in storage after saving!');
    } else {
      console.log('[POST /api/lessons/generate] Verified lesson in storage');
    }

    console.log('[POST /api/lessons/generate] Returning lesson to client');
    return NextResponse.json(lesson, { status: 200 });
  } catch (error) {
    console.error('[POST /api/lessons/generate] SERVER ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[POST /api/lessons/generate] Error message:', errorMessage);
    console.error('[POST /api/lessons/generate] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
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


import { supabase } from "@/integrations/supabase/client";

// ============================================
// SKILL-BASED API (SkillMuse 2.0)
// ============================================

// Skills Management
export async function createSkill(skill_name: string, description?: string, difficulty_level?: string) {
  // Try direct database insert first (simpler and more reliable)
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Insert directly into the database
  const { data: skill, error: dbError } = await supabase
    .from('skills')
    .insert({
      skill_name: skill_name.trim(),
      description: description?.trim() || null,
      difficulty_level: difficulty_level || 'beginner',
      created_by_user_id: user.id
    })
    .select()
    .single();

  if (dbError) {
    console.error('Database error creating skill:', dbError);
    
    // If direct insert fails, try Edge Function as fallback
    console.log('Falling back to Edge Function...');
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('skills-create', {
        body: { skill_name, description, difficulty_level }
      });

      if (edgeError) {
        throw new Error(edgeError.message || 'Failed to create skill via Edge Function');
      }

      if (edgeData && typeof edgeData === 'object') {
        if ('error' in edgeData) {
          throw new Error(edgeData.error as string);
        }
        if ('id' in edgeData) {
          return edgeData;
        }
      }
      
      throw new Error('Invalid response from Edge Function');
    } catch (edgeErr) {
      // Provide helpful error message
      let errorMessage = 'Failed to create skill. ';
      if (dbError.code === '42P01') {
        errorMessage += 'The skills table does not exist. Please run the database migration.';
      } else if (dbError.message) {
        errorMessage += dbError.message;
      } else {
        errorMessage += 'Please check your database connection and permissions.';
      }
      throw new Error(errorMessage);
    }
  }

  if (!skill) {
    throw new Error('Skill was not created. Please try again.');
  }

  if (!skill.id) {
    console.error('Skill created but missing ID:', skill);
    throw new Error('Skill created but ID is missing. Please contact support.');
  }

  return skill;
}

export async function getSkills(mySkillsOnly = false) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Query directly from database
  let query = supabase
    .from('skills')
    .select('*')
    .order('created_at', { ascending: false });

  if (mySkillsOnly) {
    query = query.eq('created_by_user_id', user.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching skills:', error);
    // Fallback to Edge Function
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('skills-list');
      if (edgeError) throw edgeError;
      return edgeData || [];
    } catch (e) {
      throw new Error('Failed to fetch skills');
    }
  }

  return data || [];
}

export async function deleteSkill(skill_id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Delete directly from database (cascade will handle related records)
  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', skill_id)
    .eq('created_by_user_id', user.id); // Only allow deleting own skills

  if (error) {
    console.error('Database error deleting skill:', error);
    throw new Error(error.message || 'Failed to delete skill');
  }

  return { success: true };
}

export async function getSkillDetail(skill_id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get skill with related data directly from database
  const { data: skill, error: skillError } = await supabase
    .from('skills')
    .select('*')
    .eq('id', skill_id)
    .single();

  if (skillError || !skill) {
    // Fallback to Edge Function
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('skills-get', {
        body: { skill_id }
      });
      if (edgeError) throw edgeError;
      return edgeData;
    } catch (e) {
      throw new Error('Skill not found');
    }
  }

  // Get content for this skill
  const { data: content, error: contentError } = await supabase
    .from('skill_content')
    .select('*')
    .eq('skill_id', skill_id)
    .order('created_at', { ascending: false });

  // Handle content error - treat 404 as empty array
  let finalContent = content || [];
  if (contentError) {
    // Check if it's a 404 error (table doesn't exist or no rows)
    const is404 = contentError.code === 'PGRST116' || 
                  contentError.message?.includes('404') || 
                  contentError.message?.includes('not found') ||
                  contentError.status === 404 ||
                  (contentError.message && contentError.message.toLowerCase().includes('relation') && contentError.message.toLowerCase().includes('does not exist'));
    
    if (is404) {
      console.warn('skill_content table or entry not found, treating as empty.');
      finalContent = [];
    } else {
      // Only log real errors (non-404)
      console.error('Error fetching skill content:', contentError);
      finalContent = [];
    }
  }

  // Get lessons for this skill
  const { data: lessons, error: lessonsError } = await supabase
    .from('skill_lessons')
    .select('*')
    .eq('skill_id', skill_id)
    .order('created_at', { ascending: false });

  // Handle lessons error - treat 404 as empty array
  let finalLessons = lessons || [];
  if (lessonsError) {
    // Check if it's a 404 error (table doesn't exist or no rows)
    const is404 = lessonsError.code === 'PGRST116' || 
                  lessonsError.message?.includes('404') || 
                  lessonsError.message?.includes('not found') ||
                  lessonsError.status === 404 ||
                  (lessonsError.message && lessonsError.message.toLowerCase().includes('relation') && lessonsError.message.toLowerCase().includes('does not exist'));
    
    if (is404) {
      console.warn('skill_lessons table or entry not found, treating as empty.');
      finalLessons = [];
    } else {
      // Only log real errors (non-404)
      console.error('Error fetching skill lessons:', lessonsError);
      finalLessons = [];
    }
  }

  console.log('Skill detail fetched:', {
    skill_id,
    content_count: finalContent.length,
    lessons_count: finalLessons.length,
    content_error: contentError && !contentError.message?.includes('404') ? contentError.message : null,
    lessons_error: lessonsError && !lessonsError.message?.includes('404') ? lessonsError.message : null
  });

  return {
    skill,
    content: finalContent,
    lessons: finalLessons
  };
}

// Content Management
export async function addContentToSkill(skill_id: string, content_type: string, source_value: string, extracted_text?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Insert directly into database
  const { data: content, error: dbError } = await supabase
    .from('skill_content')
    .insert({
      skill_id,
      content_type,
      source_value: source_value.trim(),
      extracted_text: extracted_text?.trim() || null,
      created_by_user_id: user.id
    })
    .select()
    .single();

  if (dbError) {
    console.error('Database error adding content:', dbError);
    // Fallback to Edge Function
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('skills-add-content', {
        body: { skill_id, content_type, source_value, extracted_text }
      });
      if (edgeError) throw edgeError;
      if (edgeData && typeof edgeData === 'object' && 'error' in edgeData) {
        throw new Error(edgeData.error as string);
      }
      return edgeData;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to add content';
      throw new Error(errorMessage);
    }
  }

  return content;
}

// Lesson Generation
// Generate lesson directly from content (self-learner flow)
// Now uses Next.js-style API route instead of Supabase Edge Functions
export async function generateLessonFromContent(
  skill_id: string,
  sourceType: "url" | "text",
  sourceValue: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    console.log('[generateLessonFromContent] Calling API route:', {
      skill_id,
      sourceType,
      sourceValueLength: sourceValue.length
    });

    // Get auth token for API request
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;

    // Call internal API route (same origin)
    const apiUrl = `/api/skills/${skill_id}/content`;
    console.log('[generateLessonFromContent] Making fetch request to:', apiUrl);
    console.log('[generateLessonFromContent] Request body:', {
      sourceType,
      sourceValueLength: sourceValue.trim().length
    });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      body: JSON.stringify({
        sourceType,
        sourceValue: sourceValue.trim()
      })
    }).catch((fetchError) => {
      console.error('[generateLessonFromContent] Fetch error (network/connection):', fetchError);
      throw new Error(`Network error: ${fetchError.message || 'Could not connect to server'}`);
    });

    console.log('[generateLessonFromContent] API response status:', response.status);
    console.log('[generateLessonFromContent] Response headers:', {
      contentType: response.headers.get('content-type'),
      statusText: response.statusText
    });

    if (!response.ok) {
      let errorMessage = "Lesson generation failed. Please try again.";

      // Clone response so we can read it multiple times if needed
      const responseClone = response.clone();

      try {
        const data = await response.json();
        console.error('[generateLessonFromContent] Error response data:', data);
        if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          errorMessage = data.error;
        } else if (data?.details) {
          errorMessage = `${data.error || 'Error'}: ${data.details}`;
        }
      } catch (parseError) {
        // Fallback: try reading text just for logging
        try {
          const text = await responseClone.text();
          console.error("[generateLessonFromContent] ❌ Non-JSON error response from lesson API:", text.substring(0, 500));
          errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}`;
        } catch {
          console.error("[generateLessonFromContent] ❌ Failed to read error response body");
          errorMessage = `Server error (${response.status}): Could not read error response`;
        }
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[generateLessonFromContent] Successfully generated lesson:', data.lesson?.id || data.id);
    
    // Handle both { lesson } and direct lesson response formats
    const lesson = data.lesson || data;
    return lesson;
  } catch (error) {
    console.error('[generateLessonFromContent] Caught error:', error);
    
    if (error instanceof Error) {
      // Provide user-friendly error messages
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
        throw new Error('Lesson generation failed. Please try again.');
      }
      throw error;
    }
    
    throw new Error('Lesson generation failed. Please try again.');
  }
}

export async function generateSkillLesson(
  skill_id: string,
  content_id?: string
) {
  const { data, error } = await supabase.functions.invoke('skills-generate-lesson', {
    body: { skill_id, content_id }
  });

  if (error) {
    const errorMessage = error.message || error.toString() || 'Failed to generate lesson';
    // Provide more helpful error messages
    if (errorMessage.includes('Function not found') || errorMessage.includes('404')) {
      throw new Error('Lesson generation service is not available. Please ensure Edge Functions are deployed and OpenAI API key is configured in Supabase.');
    }
    throw new Error(errorMessage);
  }
  
  if (data && typeof data === 'object' && 'error' in data) {
    const errorMsg = data.error as string;
    // Check for OpenAI API key errors
    if (errorMsg.includes('OPENAI_API_KEY') || errorMsg.includes('API key')) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in Supabase Edge Functions settings. See SETUP_GUIDE.md for instructions.');
    }
    throw new Error(errorMsg);
  }
  
  if (!data) {
    throw new Error('No data returned from lesson generation service. Please check your OpenAI API key configuration.');
  }
  
  return data;
}

// Groups Management
export async function createGroup(group_name: string, description?: string) {
  const { data, error } = await supabase.functions.invoke('groups-create', {
    body: { group_name, description }
  });

  if (error) {
    const errorMessage = error.message || error.toString() || 'Failed to create group';
    throw new Error(errorMessage);
  }
  
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(data.error as string);
  }
  
  return data;
}

export async function getGroups(myGroupsOnly = false) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get groups where user is a member
  const { data: groupMembers, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      role,
      groups (
        id,
        group_name,
        description,
        created_by_user_id,
        created_at
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching groups:', error);
    // Fallback to Edge Function
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('groups-list');
      if (edgeError) throw edgeError;
      return edgeData || [];
    } catch (e) {
      throw new Error('Failed to fetch groups');
    }
  }

  // Transform the data
  const formattedGroups = (groupMembers || []).map((gm: any) => ({
    ...gm.groups,
    role: gm.role
  }));

  return formattedGroups;
}

export async function addGroupMember(group_id: string, user_id: string, role?: string) {
  const { data, error } = await supabase.functions.invoke('groups-add-member', {
    body: { group_id, user_id, role }
  });

  if (error) {
    const errorMessage = error.message || error.toString() || 'Failed to add member';
    throw new Error(errorMessage);
  }
  
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(data.error as string);
  }
  
  return data;
}

// Progress Tracking
export async function updateProgress(
  skill_id: string,
  lesson_id?: string,
  quiz_score?: number,
  completed?: boolean
) {
  const { data, error } = await supabase.functions.invoke('progress-update', {
    body: { skill_id, lesson_id, quiz_score, completed }
  });

  if (error) {
    const errorMessage = error.message || error.toString() || 'Failed to update progress';
    throw new Error(errorMessage);
  }
  
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(data.error as string);
  }
  
  return data;
}

// Trainer Spaces
export async function createTrainerSpace(space_name: string, description?: string) {
  const { data, error } = await supabase.functions.invoke('trainer-space-create', {
    body: { space_name, description }
  });

  if (error) {
    const errorMessage = error.message || error.toString() || 'Failed to create trainer space';
    throw new Error(errorMessage);
  }
  
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(data.error as string);
  }
  
  return data;
}

export async function getTrainerSpaces() {
  const { data, error } = await supabase.functions.invoke('trainer-spaces-list');

  if (error) throw error;
  return data;
}

// ============================================
// LEGACY API (for backward compatibility)
// ============================================

export async function createLessonFromUrl(url: string) {
  const { data, error } = await supabase.functions.invoke('lessons-from-url', {
    body: { url }
  });

  if (error) {
    const errorMessage = error.message || error.toString() || 'Failed to generate lesson';
    throw new Error(errorMessage);
  }
  
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(data.error as string);
  }
  
  return data;
}

export async function getLessons() {
  const { data, error } = await supabase.functions.invoke('lessons-list');

  if (error) throw error;
  return data;
}

export async function getLessonDetail(lessonId: string) {
  const { data, error } = await supabase.functions.invoke('lessons-detail', {
    body: { id: lessonId }
  });

  if (error) throw error;
  return data;
}

export async function submitQuiz(lessonId: string, answers: number[]) {
  const { data, error } = await supabase.functions.invoke('lessons-quiz', {
    body: { lessonId, answers }
  });

  if (error) throw error;
  return data;
}

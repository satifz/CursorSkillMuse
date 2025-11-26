import { SkillLesson } from '@/types/lesson';

// In-memory storage for MVP
// In production, replace with a proper database (Prisma + SQLite/PostgreSQL)

const DEMO_USER_ID = "demo-user-1";

class LessonStorage {
  private lessons: Map<string, SkillLesson> = new Map();

  // Get all lessons for demo user
  getAllLessons(): SkillLesson[] {
    return Array.from(this.lessons.values())
      .filter(lesson => lesson.userId === DEMO_USER_ID)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get all lessons for a specific skill
  getLessonsBySkillId(skillId: string): SkillLesson[] {
    return Array.from(this.lessons.values())
      .filter(lesson => lesson.skillId === skillId && lesson.userId === DEMO_USER_ID)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get a single lesson by ID
  getLessonById(id: string): SkillLesson | null {
    const lesson = this.lessons.get(id);
    if (lesson && lesson.userId === DEMO_USER_ID) {
      return lesson;
    }
    return null;
  }

  // Save a new lesson
  saveLesson(lesson: SkillLesson): void {
    console.log('[LessonStorage] Saving lesson:', lesson.id);
    this.lessons.set(lesson.id, lesson);
    console.log('[LessonStorage] Total lessons in storage:', this.lessons.size);
    console.log('[LessonStorage] Lessons for demo user:', this.getAllLessons().length);
  }

  // Delete a lesson
  deleteLesson(id: string): boolean {
    const lesson = this.lessons.get(id);
    if (lesson && lesson.userId === DEMO_USER_ID) {
      this.lessons.delete(id);
      return true;
    }
    return false;
  }
}

// Singleton instance
export const lessonStorage = new LessonStorage();


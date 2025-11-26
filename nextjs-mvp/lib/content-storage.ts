import { SkillContent } from '@/types/lesson';

// In-memory storage for skill content
const DEMO_USER_ID = "demo-user-1";

class ContentStorage {
  private content: Map<string, SkillContent> = new Map();

  // Get all content for a specific skill
  getContentBySkillId(skillId: string): SkillContent[] {
    return Array.from(this.content.values())
      .filter(item => item.skillId === skillId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get a single content item by ID
  getContentById(id: string): SkillContent | null {
    return this.content.get(id) || null;
  }

  // Save a new content item
  saveContent(content: SkillContent): void {
    console.log('[ContentStorage] Saving content:', content.id);
    this.content.set(content.id, content);
    console.log('[ContentStorage] Total content items in storage:', this.content.size);
  }

  // Delete a content item
  deleteContent(id: string): boolean {
    if (this.content.has(id)) {
      this.content.delete(id);
      return true;
    }
    return false;
  }
}

// Singleton instance
export const contentStorage = new ContentStorage();


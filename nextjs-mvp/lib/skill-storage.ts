import { Skill } from '@/types/lesson';

// In-memory storage for skills
const DEMO_USER_ID = "demo-user-1";

class SkillStorage {
  private skills: Map<string, Skill> = new Map();

  // Get all skills for demo user
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values())
      .filter(skill => skill.userId === DEMO_USER_ID)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get a single skill by ID
  getSkillById(id: string): Skill | null {
    const skill = this.skills.get(id);
    if (skill && skill.userId === DEMO_USER_ID) {
      return skill;
    }
    return null;
  }

  // Save a new skill
  saveSkill(skill: Skill): void {
    console.log('[SkillStorage] Saving skill:', skill.id);
    this.skills.set(skill.id, skill);
    console.log('[SkillStorage] Total skills in storage:', this.skills.size);
  }

  // Delete a skill
  deleteSkill(id: string): boolean {
    const skill = this.skills.get(id);
    if (skill && skill.userId === DEMO_USER_ID) {
      this.skills.delete(id);
      return true;
    }
    return false;
  }
}

// Singleton instance
export const skillStorage = new SkillStorage();


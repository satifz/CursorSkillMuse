export type Skill = {
  id: string;
  userId: string;        // "demo-user-1" for now
  skill_name: string;
  description: string;
  difficulty: string;
  createdAt: string;
};

export type SkillContent = {
  id: string;
  skillId: string;
  sourceType: "url" | "text";
  sourceValue: string;      // URL or raw text
  extractedText: string;    // the cleaned text used for AI
  createdAt: string;
};

export type SkillLesson = {
  id: string;
  skillId: string;
  userId: string;         // for now "demo-user-1" is fine
  skillName: string;
  shortDescription: string;
  learningOutcomes: string[];
  summary: { 
    mainPoints: string[] 
  };
  visual: { 
    slides: { 
      title: string; 
      body: string; 
      bullets: string[] 
    }[] 
  };
  quiz: { 
    questions: { 
      question: string; 
      options: string[]; 
      correctIndex: number; 
      explanation: string 
    }[] 
  };
  createdAt: string;
};

export type LessonInput = {
  userGoal?: string;
  sourceType: "url" | "text";
  sourceValue: string;
};

export type QuizResult = {
  score: number;
  correctCount: number;
  total: number;
};


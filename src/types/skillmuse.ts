export interface SkillMuseLesson {
  id: string;
  url: string;
  title: string;
  createdAt: string;
  oneLineSummary: string;
  keyPoints: string[];
  sections: SkillMuseSection[];
  flowNodes: SkillMuseFlowNode[];
  quizQuestions: SkillMuseQuizQuestion[];
  flashcards: SkillMuseFlashcard[];
}

export interface SkillMuseSection {
  heading: string;
  summary: string;
  bullets: string[];
}

export interface SkillMuseFlowNode {
  id: string;
  label: string;
  description: string;
  order: number;
}

export interface SkillMuseQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SkillMuseFlashcard {
  id: string;
  front: string;
  back: string;
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Loader2 } from 'lucide-react';
import { SkillLesson } from '@/types/lesson';
import { format } from 'date-fns';

export default function LessonsList() {
  const [lessons, setLessons] = useState<SkillLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/lessons');
      if (response.ok) {
        const data = await response.json();
        setLessons(data);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Lessons</h1>
          <Link
            href="/"
            className="text-primary hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {lessons.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No lessons yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first lesson to get started!
            </p>
            <Link
              href="/"
              className="inline-block bg-primary text-primary-foreground py-2 px-6 rounded-md hover:bg-primary/90"
            >
              Create Lesson
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="block bg-card border border-border rounded-xl p-6 hover:bg-accent transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{lesson.skillName}</h3>
                    <p className="text-muted-foreground mb-2">{lesson.shortDescription}</p>
                  </div>
                </div>
                {lesson.learningOutcomes.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Learning Outcomes:
                    </p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      {lesson.learningOutcomes.slice(0, 2).map((outcome, idx) => (
                        <li key={idx}>{outcome}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                  Created: {format(new Date(lesson.createdAt), "PPP")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


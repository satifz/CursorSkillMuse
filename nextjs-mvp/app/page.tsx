'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, BookOpen } from 'lucide-react';
import { LessonInput } from '@/types/lesson';

export default function Dashboard() {
  const router = useRouter();
  const [userGoal, setUserGoal] = useState('');
  const [sourceType, setSourceType] = useState<'url' | 'text'>('url');
  const [sourceValue, setSourceValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sourceValue.trim()) {
      setError('Please enter a URL or text content');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('[Dashboard] Submitting lesson generation request');
      const response = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userGoal: userGoal.trim() || undefined,
          sourceType,
          sourceValue: sourceValue.trim(),
        } as LessonInput),
      });

      console.log('[Dashboard] Response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('[Dashboard] Error response:', data);
        throw new Error(data.error || data.message || 'Failed to generate lesson');
      }

      const lesson = await response.json();
      console.log('[Dashboard] Lesson created successfully:', lesson.id);
      
      // Navigate to the lesson detail page
      router.push(`/lessons/${lesson.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate lesson';
      setError(errorMessage);
      console.error('[Dashboard] Error generating lesson:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">SkillMuse</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Transform any content into structured skill lessons
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6">Create a New Lesson</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Goal (Optional) */}
            <div>
              <label htmlFor="userGoal" className="block text-sm font-medium mb-2">
                User Goal (Optional)
              </label>
              <input
                id="userGoal"
                type="text"
                placeholder="e.g., Learn React Hooks, Master Data Science"
                value={userGoal}
                onChange={(e) => setUserGoal(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                What skill do you want to learn? (AI will infer if not provided)
              </p>
            </div>

            {/* Source Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Content Source</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="url"
                    checked={sourceType === 'url'}
                    onChange={(e) => setSourceType(e.target.value as 'url' | 'text')}
                    className="mr-2"
                    disabled={isGenerating}
                  />
                  URL
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="text"
                    checked={sourceType === 'text'}
                    onChange={(e) => setSourceType(e.target.value as 'url' | 'text')}
                    className="mr-2"
                    disabled={isGenerating}
                  />
                  Text/Notes
                </label>
              </div>
            </div>

            {/* Source Value */}
            <div>
              <label htmlFor="sourceValue" className="block text-sm font-medium mb-2">
                {sourceType === 'url' ? 'URL' : 'Text Content'} *
              </label>
              {sourceType === 'url' ? (
                <input
                  id="sourceValue"
                  type="url"
                  placeholder="https://example.com/article"
                  value={sourceValue}
                  onChange={(e) => setSourceValue(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isGenerating}
                  required
                />
              ) : (
                <textarea
                  id="sourceValue"
                  placeholder="Paste or type your learning content here..."
                  value={sourceValue}
                  onChange={(e) => setSourceValue(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  disabled={isGenerating}
                  required
                />
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Lesson...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Lesson
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recent Lessons Link */}
        <div className="mt-8 text-center">
          <a
            href="/lessons"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <BookOpen className="h-5 w-5" />
            View All Lessons
          </a>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles, BookOpen, Link as LinkIcon, FileText } from 'lucide-react';
import { Skill, SkillLesson, SkillContent } from '@/types/lesson';
import { format } from 'date-fns';

export default function AddContentPage() {
  const params = useParams();
  const router = useRouter();
  const skillId = params.id as string;

  const [skill, setSkill] = useState<Skill | null>(null);
  const [content, setContent] = useState<SkillContent[]>([]);
  const [lessons, setLessons] = useState<SkillLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceType, setSourceType] = useState<'url' | 'text'>('text');
  const [sourceValue, setSourceValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (skillId) {
      fetchSkillAndLessons();
    }
  }, [skillId]);

  const fetchSkillAndLessons = async () => {
    setIsLoading(true);
    try {
      // Fetch skill
      const skillResponse = await fetch(`/api/skills/${skillId}`);
      if (skillResponse.ok) {
        const skillData = await skillResponse.json();
        setSkill(skillData);
      }

      // Fetch content
      const contentResponse = await fetch(`/api/skills/${skillId}/content-list`);
      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        setContent(contentData);
      }

      // Fetch lessons
      const lessonsResponse = await fetch(`/api/skills/${skillId}/lessons`);
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        setLessons(lessonsData);
      }
    } catch (error) {
      console.error('[AddContentPage] Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!sourceValue.trim()) {
      setError('Please enter a URL or text content');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('[AddContentPage] Submitting lesson generation request');
      const response = await fetch(`/api/skills/${skillId}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType,
          sourceValue: sourceValue.trim(),
        }),
      });

      console.log('[AddContentPage] Response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('[AddContentPage] Error response:', data);
        throw new Error(data.error || data.message || 'Failed to generate lesson');
      }

      const lesson = await response.json();
      console.log('[AddContentPage] Lesson created successfully:', lesson.id);
      
      setSuccess('Lesson generated successfully!');
      setSourceValue(''); // Clear form
      
      // Refresh lessons list
      await fetchSkillAndLessons();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate lesson';
      setError(errorMessage);
      console.error('[AddContentPage] Error generating lesson:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Skill not found</p>
          <Link href="/skills/create" className="text-primary hover:underline">
            Create a Skill
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/skills/create"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Create Skill
        </Link>

        {/* Skill Info */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{skill.skill_name}</h1>
              <p className="text-muted-foreground mb-2">{skill.description || 'No description'}</p>
              <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full capitalize">
                {skill.difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Add Content Form */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm mb-8">
          <h2 className="text-2xl font-semibold mb-6">Add Content</h2>
          
          <form onSubmit={handleGenerateLesson} className="space-y-6">
            {/* Source Type Toggle */}
            <div>
              <label className="block text-sm font-medium mb-2">Content Source</label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="text"
                    checked={sourceType === 'text'}
                    onChange={(e) => setSourceType(e.target.value as 'url' | 'text')}
                    className="mr-2"
                    disabled={isGenerating}
                  />
                  <FileText className="mr-2 h-4 w-4" />
                  From Text
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="url"
                    checked={sourceType === 'url'}
                    onChange={(e) => setSourceType(e.target.value as 'url' | 'text')}
                    className="mr-2"
                    disabled={isGenerating}
                  />
                  <LinkIcon className="mr-2 h-4 w-4" />
                  From URL
                </label>
              </div>
            </div>

            {/* Source Value Input */}
            <div>
              <label htmlFor="sourceValue" className="block text-sm font-medium mb-2">
                {sourceType === 'url' ? 'Content URL' : 'Paste your content'} *
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
                  placeholder="Paste an article, notes, or any learning material here…"
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

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
                {success}
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
                  {sourceType === 'url' ? 'Generate Lesson from URL' : 'Generate Lesson from Text'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Content Sources */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm mb-8">
          <h2 className="text-2xl font-semibold mb-6">Content Sources</h2>
          
          {content.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No content sources yet</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {content.map((item) => (
                <div
                  key={item.id}
                  className="bg-background border border-border rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                          {item.sourceType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {item.sourceValue}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.extractedText.length} characters extracted
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Existing Lessons */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6">Lessons for this Skill</h2>
          
          {lessons.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No lessons yet</h3>
              <p className="text-muted-foreground">
                Generate your first lesson using the form above
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  className="block bg-background border border-border rounded-xl p-6 hover:bg-accent transition-colors"
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
    </div>
  );
}


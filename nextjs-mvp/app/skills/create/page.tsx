'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';

export default function CreateSkill() {
  const router = useRouter();
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!skillName.trim()) {
      setError('Skill name is required');
      return;
    }

    setIsCreating(true);

    try {
      console.log('[CreateSkill] Submitting skill creation request');
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skill_name: skillName.trim(),
          description: description.trim(),
          difficulty,
        }),
      });

      console.log('[CreateSkill] Response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('[CreateSkill] Error response:', data);
        throw new Error(data.error || data.message || 'Failed to create skill');
      }

      const skill = await response.json();
      console.log('[CreateSkill] Skill created successfully:', skill.id);
      
      // Redirect to Add Content page
      router.push(`/skills/${skill.id}/content`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create skill';
      setError(errorMessage);
      console.error('[CreateSkill] Error creating skill:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Create a New Skill</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Define a skill you want to learn
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Skill Name */}
            <div>
              <label htmlFor="skillName" className="block text-sm font-medium mb-2">
                Skill Name *
              </label>
              <input
                id="skillName"
                type="text"
                placeholder="e.g., React Hooks, Data Science, Python Programming"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isCreating}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                placeholder="Optional: Describe what this skill is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                disabled={isCreating}
              />
            </div>

            {/* Difficulty */}
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium mb-2">
                Difficulty Level
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isCreating}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
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
              disabled={isCreating}
              className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Skill...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Create Skill
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


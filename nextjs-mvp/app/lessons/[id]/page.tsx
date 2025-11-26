'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { SkillLesson, QuizResult } from '@/types/lesson';

export default function LessonDetail() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<SkillLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchLesson(params.id as string);
    }
  }, [params.id]);

  const fetchLesson = async (id: string) => {
    console.log('[LessonDetail] Fetching lesson:', id);
    try {
      const response = await fetch(`/api/lessons/${id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[LessonDetail] Lesson data received:', {
          id: data.id,
          skill_name: data.skill_name,
          has_learning_outcomes: !!data.learning_outcomes,
          has_summary: !!data.summary,
          has_visual: !!data.visual,
          has_quiz: !!data.quiz
        });
        setLesson(data);
      } else {
        console.error('[LessonDetail] Failed to fetch lesson, status:', response.status);
        router.push('/lessons');
      }
    } catch (error) {
      console.error('[LessonDetail] Error fetching lesson:', error);
      router.push('/lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizSubmit = () => {
    if (!lesson) return;

    let correctCount = 0;
    lesson.quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const total = lesson.quiz.questions.length;
    const score = Math.round((correctCount / total) * 100);
    
    const result: QuizResult = {
      score,
      correctCount,
      total
    };
    
    setQuizResult(result);
    setShowResults(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Lesson not found</p>
          <Link href="/lessons" className="text-primary hover:underline">
            Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/lessons"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lessons
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{lesson.skillName}</h1>
          <p className="text-lg text-muted-foreground mb-4">{lesson.shortDescription}</p>
        </div>

        {/* Learning Outcomes */}
        {(lesson.learningOutcomes && lesson.learningOutcomes.length > 0) ? (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Learning Outcomes</h2>
            <ul className="list-disc list-inside space-y-2">
              {lesson.learningOutcomes.map((outcome, idx) => (
                <li key={idx} className="text-muted-foreground">{outcome}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <p className="text-muted-foreground">No learning outcomes available</p>
          </div>
        )}

        {/* Summary Key Points */}
        {(lesson.summary?.mainPoints && lesson.summary.mainPoints.length > 0) ? (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Key Points</h2>
            <ul className="list-disc list-inside space-y-2">
              {lesson.summary.mainPoints.map((point, idx) => (
                <li key={idx} className="text-muted-foreground">{point}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <p className="text-muted-foreground">No summary points available</p>
          </div>
        )}

        {/* Visual Slides */}
        {(lesson.visual?.slides && lesson.visual.slides.length > 0) ? (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">Visual Slides</h2>
            <div className="space-y-6">
              {lesson.visual.slides.map((slide, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-border rounded-xl p-6 shadow-sm"
                >
                  <h3 className="text-xl font-semibold mb-3">{slide.title || 'Untitled Slide'}</h3>
                  <p className="text-muted-foreground mb-4">{slide.body || 'No content'}</p>
                  {slide.bullets && slide.bullets.length > 0 && (
                    <ul className="list-disc list-inside space-y-1">
                      {slide.bullets.map((bullet, bulletIdx) => (
                        <li key={bulletIdx} className="text-muted-foreground">{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <p className="text-muted-foreground">No visual slides available</p>
          </div>
        )}

        {/* Quiz */}
        {(lesson.quiz?.questions && lesson.quiz.questions.length > 0) ? (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-6">Quiz</h2>
            
            {!showResults ? (
              <div className="space-y-6">
                {lesson.quiz.questions.map((q, qIdx) => (
                  <div key={qIdx} className="border-b border-border pb-6 last:border-0 last:pb-0">
                    <h3 className="font-semibold mb-4">
                      {qIdx + 1}. {q.question}
                    </h3>
                    <div className="space-y-2">
                      {q.options.map((option, optIdx) => (
                        <label
                          key={optIdx}
                          className="flex items-center p-3 border border-input rounded-md hover:bg-accent cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`question-${qIdx}`}
                            value={optIdx}
                            checked={selectedAnswers[qIdx] === optIdx}
                            onChange={() => setSelectedAnswers({ ...selectedAnswers, [qIdx]: optIdx })}
                            className="mr-3"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(selectedAnswers).length !== lesson.quiz.questions.length}
                  className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Quiz
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-6">
                  <div className="text-4xl font-bold mb-2">
                    {quizResult && quizResult.score >= 70 ? (
                      <span className="text-green-600">🎉 {quizResult.score}%</span>
                    ) : (
                      <span className="text-orange-600">{quizResult?.score}%</span>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    You got {quizResult?.correctCount} out of {quizResult?.total} questions correct
                  </p>
                </div>

                {lesson.quiz.questions.map((q, qIdx) => {
                  const userAnswer = selectedAnswers[qIdx];
                  const isCorrect = userAnswer === q.correctIndex;
                  
                  return (
                    <div key={qIdx} className="border-b border-border pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <h3 className="font-semibold flex-1">
                          {qIdx + 1}. {q.question}
                        </h3>
                      </div>
                      <div className="space-y-2 ml-7">
                        {q.options.map((option, optIdx) => {
                          const isSelected = userAnswer === optIdx;
                          const isCorrectOption = optIdx === q.correctIndex;
                          
                          return (
                            <div
                              key={optIdx}
                              className={`p-3 border rounded-md ${
                                isCorrectOption
                                  ? 'bg-green-50 border-green-200'
                                  : isSelected
                                  ? 'bg-red-50 border-red-200'
                                  : 'border-input'
                              }`}
                            >
                              <span className={isCorrectOption ? 'font-semibold' : ''}>
                                {option}
                              </span>
                              {isCorrectOption && (
                                <span className="ml-2 text-green-600 text-sm">✓ Correct</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="ml-7 mt-2 text-sm text-muted-foreground">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-muted-foreground">No quiz questions available</p>
          </div>
        )}
      </div>
    </div>
  );
}


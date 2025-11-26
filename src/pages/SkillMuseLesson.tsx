import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle2, XCircle, ChevronLeft, ArrowRight } from "lucide-react";
import { getLessonDetail } from "@/lib/skillmuse/api";
import { SkillMuseLesson } from "@/types/skillmuse";
import { format } from "date-fns";

export default function SkillMuseLessonPage() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<SkillMuseLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      fetchLesson(id);
    }
  }, [id]);

  const fetchLesson = async (lessonId: string) => {
    setIsLoading(true);
    try {
      const data = await getLessonDetail(lessonId);
      setLesson(data);
    } catch (error) {
      console.error("Error fetching lesson:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    setShowExplanations(prev => ({ ...prev, [questionId]: true }));
  };

  const toggleFlashcard = (cardId: string) => {
    setFlippedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
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
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Lesson not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link to="/skillmuse">
          <Button variant="ghost" className="mb-6">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Lesson Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{lesson.title}</CardTitle>
                <CardDescription className="text-base">
                  {lesson.oneLineSummary}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
              <a
                href={lesson.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="truncate max-w-xs">{lesson.url}</span>
              </a>
              <span>•</span>
              <span>{format(new Date(lesson.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </CardHeader>
        </Card>

        {/* Key Points */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Key Takeaways</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {lesson.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-0.5">{index + 1}</Badge>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold">Content Breakdown</h2>
          {lesson.sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-xl">{section.heading}</CardTitle>
                <CardDescription>{section.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {section.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>{bullet}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Visual Flow */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Learning Flow</CardTitle>
            <CardDescription>Follow the conceptual progression</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lesson.flowNodes
                .sort((a, b) => a.order - b.order)
                .map((node, index) => (
                  <div key={node.id} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{node.label}</h4>
                      <p className="text-sm text-muted-foreground">{node.description}</p>
                    </div>
                    {index < lesson.flowNodes.length - 1 && (
                      <ArrowRight className="flex-shrink-0 h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Quiz */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Knowledge Check</CardTitle>
            <CardDescription>Test your understanding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {lesson.quizQuestions.map((question, qIndex) => (
              <div key={question.id} className="space-y-3">
                <h4 className="font-semibold">
                  {qIndex + 1}. {question.question}
                </h4>
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => {
                    const isSelected = selectedAnswers[question.id] === oIndex;
                    const isCorrect = question.correctIndex === oIndex;
                    const showResult = showExplanations[question.id];

                    return (
                      <Button
                        key={oIndex}
                        variant={isSelected ? (isCorrect ? "default" : "destructive") : "outline"}
                        className="w-full justify-start text-left h-auto py-3 px-4"
                        onClick={() => handleAnswerSelect(question.id, oIndex)}
                        disabled={showResult}
                      >
                        <span className="flex items-center gap-2 flex-1">
                          {showResult && isCorrect && <CheckCircle2 className="h-4 w-4" />}
                          {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4" />}
                          {option}
                        </span>
                      </Button>
                    );
                  })}
                </div>
                {showExplanations[question.id] && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{question.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Flashcards */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Flashcards</CardTitle>
            <CardDescription>Quick revision cards - click to flip</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {lesson.flashcards.map((card) => (
                <Card
                  key={card.id}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => toggleFlashcard(card.id)}
                >
                  <CardContent className="p-6 min-h-[120px] flex items-center justify-center text-center">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {flippedCards[card.id] ? "Answer" : "Question"}
                      </p>
                      <p className="font-medium">
                        {flippedCards[card.id] ? card.back : card.front}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

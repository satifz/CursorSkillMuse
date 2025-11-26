import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getLessonDetail, submitQuiz } from "@/lib/api";
import { Loader2, ArrowLeft, ExternalLink, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Lesson {
  id: string;
  title: string;
  short_description: string;
  source_type: string;
  source_value: string;
  created_at: string;
  summary_json: {
    mainPoints: string[];
  };
  visual_json: {
    slides: Array<{
      title: string;
      body: string;
      bullets: string[];
    }>;
  };
  quiz_json: {
    questions: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }>;
  };
}

const LessonDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; correctCount: number; total: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await getLessonDetail(id);
        setLesson(data);
      } catch (error) {
        console.error("Error fetching lesson:", error);
        toast({
          title: "Error",
          description: "Failed to load lesson",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [id, toast]);

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!lesson || !id) return;

    const answers = lesson.quiz_json.questions.map((_, idx) => selectedAnswers[idx] ?? -1);
    
    if (answers.some(a => a === -1)) {
      toast({
        title: "Incomplete Quiz",
        description: "Please answer all questions before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitQuiz(id, answers);
      setQuizResult(result);
      toast({
        title: "Quiz Submitted!",
        description: `You scored ${result.score}% (${result.correctCount}/${result.total} correct)`
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Lesson not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6 hover:bg-muted">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Floating Back Button for Desktop */}
        <Link to="/dashboard" className="hidden md:block">
          <Button
            size="lg"
            className="fixed bottom-8 right-8 shadow-lg hover:shadow-xl transition-shadow z-50 rounded-full w-14 h-14 p-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <Badge variant="outline" className="mb-3 border-primary/50">
            <BookOpen className="mr-1 h-3 w-3" />
            Visual Lesson
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            {lesson.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-4 leading-relaxed">
            {lesson.short_description}
          </p>
          {lesson.source_type === 'url' && (
            <a
              href={lesson.source_value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1 mb-2"
            >
              View source article <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <p className="text-sm text-muted-foreground">
            Created {format(new Date(lesson.created_at), "PPP")}
          </p>
        </div>

        <Separator className="my-8" />

        {/* Summary Section */}
        <Card className="p-6 md:p-8 mb-8 bg-gradient-to-br from-saudi-green/5 to-saudi-teal/5 border-saudi-green/20 animate-fade-in shadow-soft">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-saudi-green rounded-full" />
            Main Points
          </h2>
          <ul className="space-y-3">
            {lesson.summary_json.mainPoints.map((point, idx) => (
              <li 
                key={idx} 
                className="flex items-start gap-4 animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <CheckCircle2 className="h-5 w-5 text-saudi-green mt-0.5 flex-shrink-0" />
                <span className="text-foreground text-base md:text-lg">{point}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Slides Section */}
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-saudi-teal rounded-full" />
            Visual Lesson Slides
          </h2>
          <div className="space-y-6">
            {lesson.visual_json.slides.map((slide, idx) => (
              <Card 
                key={idx} 
                className="p-6 md:p-8 shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in border-l-4 border-l-saudi-teal"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                    {idx + 1}
                  </Badge>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground flex-1">
                    {slide.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-base md:text-lg mb-5 leading-relaxed pl-12">
                  {slide.body}
                </p>
                <ul className="space-y-2 pl-12">
                  {slide.bullets.map((bullet, bulletIdx) => (
                    <li key={bulletIdx} className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-saudi-blue mt-2 flex-shrink-0" />
                      <span className="text-foreground">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        <Separator className="my-10" />

        {/* Quiz Section */}
        <Card className="p-6 md:p-8 shadow-card animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <span className="w-1 h-8 bg-saudi-blue rounded-full" />
            Quick Quiz
          </h2>
          <p className="text-muted-foreground mb-8">
            Test your understanding of the lesson
          </p>
          
          {quizResult ? (
            <div className={`p-6 md:p-8 rounded-xl mb-8 border-2 ${
              quizResult.score >= 70 
                ? 'bg-saudi-green/10 border-saudi-green' 
                : 'bg-destructive/10 border-destructive'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {quizResult.score >= 70 ? (
                  <CheckCircle2 className="h-10 w-10 text-saudi-green" />
                ) : (
                  <XCircle className="h-10 w-10 text-destructive" />
                )}
                <div>
                  <h3 className="text-2xl font-bold">
                    Your Score: {quizResult.correctCount} / {quizResult.total}
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    {quizResult.score}% - {quizResult.score >= 70 ? 'Excellent work! 🎉' : 'Keep learning! 📚'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-8">
            {lesson.quiz_json.questions.map((question, qIdx) => (
              <div key={qIdx} className="pb-6 border-b border-border last:border-0">
                <p className="font-semibold text-foreground text-lg mb-4">
                  Question {qIdx + 1}: {question.question}
                </p>
                <RadioGroup
                  value={selectedAnswers[qIdx]?.toString()}
                  onValueChange={(value) => handleAnswerChange(qIdx, parseInt(value))}
                  disabled={!!quizResult}
                >
                  {question.options.map((option, oIdx) => {
                    const isCorrect = oIdx === question.correctIndex;
                    const isSelected = selectedAnswers[qIdx] === oIdx;
                    const showFeedback = !!quizResult;
                    
                    return (
                      <div
                        key={oIdx}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                          showFeedback && isCorrect
                            ? 'bg-saudi-green/10 border-saudi-green shadow-sm'
                            : showFeedback && isSelected && !isCorrect
                            ? 'bg-destructive/10 border-destructive'
                            : 'border-border hover:bg-muted/50 hover:border-muted-foreground/30'
                        }`}
                      >
                        <RadioGroupItem value={oIdx.toString()} id={`q${qIdx}-o${oIdx}`} />
                        <Label 
                          htmlFor={`q${qIdx}-o${oIdx}`} 
                          className="flex-1 cursor-pointer font-medium"
                        >
                          {option}
                        </Label>
                        {showFeedback && isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-saudi-green" />
                        )}
                        {showFeedback && isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>
                {quizResult && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-l-saudi-blue">
                    <p className="text-sm text-muted-foreground italic flex items-start gap-2">
                      <span className="font-semibold text-foreground">Explanation:</span>
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!quizResult && (
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="w-full mt-8 text-lg py-6"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Checking Answers...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Check Answers
                </>
              )}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LessonDetail;

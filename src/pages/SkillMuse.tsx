import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { processUrl, getLessonsList } from "@/lib/skillmuse/api";
import { formatDistanceToNow } from "date-fns";

export default function SkillMuse() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);
  const [isFetchingLessons, setIsFetchingLessons] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    setIsFetchingLessons(true);
    try {
      const data = await getLessonsList(1, 10);
      setLessons(data.lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setIsFetchingLessons(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      toast.error("Please enter a URL");
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setIsLoading(true);

    try {
      const lesson = await processUrl(trimmedUrl);
      toast.success("Visual lesson created successfully!");
      setUrl(""); // Clear input on success
      navigate(`/skillmuse/${lesson.id}`);
    } catch (error: any) {
      console.error("Error creating lesson:", error);
      
      // Handle specific error types
      if (error.message?.includes('Rate limit')) {
        toast.error("Too many requests. Please try again in a few moments.");
      } else if (error.message?.includes('Unable to fetch URL')) {
        toast.error("This URL could not be fetched. Please try another link.");
      } else if (error.message?.includes('credits')) {
        toast.error("AI service limit reached. Please contact support.");
      } else {
        toast.error("Something went wrong while generating your lesson. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getDomain = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.hostname.replace('www.', '');
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">SkillMuse Dashboard</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Turn any link into a visual lesson
          </p>
        </div>

        {/* URL Input Card */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Create New Visual Lesson</CardTitle>
            <CardDescription>
              Paste any article, blog post, or documentation URL to generate an interactive learning experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                className="text-base"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Visual Lesson...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Visual Lesson
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Lessons */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Lessons</h2>
          
          {isFetchingLessons ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : lessons.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No lessons yet. Paste a link above to create your first visual lesson.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {lessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/skillmuse/${lesson.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-clamp-2">
                          {lesson.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-2">
                          {lesson.oneLineSummary}
                        </CardDescription>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="truncate">{getDomain(lesson.url)}</span>
                      <span>
                        {formatDistanceToNow(new Date(lesson.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Plus, BookOpen, FileText, Sparkles } from "lucide-react";
import { getSkillDetail, addContentToSkill, generateSkillLesson } from "@/lib/api";
import { format } from "date-fns";
import AddContentForm from "@/components/AddContentForm";

interface SkillDetail {
  skill: {
    id: string;
    skill_name: string;
    description: string;
    difficulty_level: string;
    learning_outcomes: string[];
    created_at: string;
  };
  content: Array<{
    id: string;
    content_type: string;
    source_value: string;
    created_at: string;
  }>;
  lessons: Array<{
    id: string;
    title: string;
    short_description: string;
    learning_outcomes: string[];
    created_at: string;
  }>;
}

const SkillDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [skillData, setSkillData] = useState<SkillDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddContent, setShowAddContent] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSkillDetail();
    }
  }, [id]);

  const fetchSkillDetail = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const data = await getSkillDetail(id);
      console.log('Skill detail data received:', data);
      
      if (data && data.skill) {
        console.log('Setting skill data:', {
          skill: data.skill,
          content_count: data.content?.length || 0,
          lessons_count: data.lessons?.length || 0
        });
        setSkillData(data);
      } else {
        throw new Error('Invalid skill data received');
      }
    } catch (error) {
      console.error("Error fetching skill:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load skill details.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContent = async () => {
    setShowAddContent(false);
    await fetchSkillDetail();
  };

  const handleLessonGenerated = async (lessonId: string) => {
    console.log('[SkillDetail] Lesson generated, refreshing data...', lessonId);
    await fetchSkillDetail();
    // Optionally navigate to lesson
    // navigate(`/lessons/${lessonId}`);
  };

  const handleGenerateLesson = async (contentId?: string) => {
    if (!id) return;

    setIsGenerating(true);
    try {
      const lesson = await generateSkillLesson(id, contentId);
      toast({
        title: "Success!",
        description: "Lesson generated successfully."
      });
      navigate(`/lessons/${lesson.id}`);
    } catch (error) {
      console.error("Error generating lesson:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate lesson.";
      
      // Provide more helpful error messages
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('OPENAI_API_KEY') || errorMessage.includes('API key')) {
        userFriendlyMessage = "OpenAI API key is not configured. Please set OPENAI_API_KEY in your Supabase Edge Functions settings. Check SETUP_GUIDE.md for instructions.";
      } else if (errorMessage.includes('Function not found') || errorMessage.includes('not available')) {
        userFriendlyMessage = "Lesson generation service is not available. Please ensure Edge Functions are deployed in Supabase.";
      }
      
      toast({
        title: "Error Generating Lesson",
        description: userFriendlyMessage,
        variant: "destructive"
      });
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

  if (!skillData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8">
          <p className="text-muted-foreground">Skill not found</p>
          <Link to="/dashboard">
            <Button variant="outline" className="mt-4">
              Back to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { skill, content = [], lessons = [] } = skillData;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">{skill.skill_name}</CardTitle>
                <CardDescription className="text-base">
                  {skill.description || "No description"}
                </CardDescription>
              </div>
              <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full capitalize">
                {skill.difficulty_level}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {skill.learning_outcomes && skill.learning_outcomes.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Learning Outcomes:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {skill.learning_outcomes.map((outcome, idx) => (
                    <li key={idx}>{outcome}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              Created: {format(new Date(skill.created_at), "PPP")}
            </p>
          </CardContent>
        </Card>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-4 p-4 bg-muted">
            <p className="text-xs font-mono">
              Debug: Content items: {content?.length ?? 'undefined'}, Lessons: {lessons?.length ?? 'undefined'}
            </p>
          </Card>
        )}

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">
              <FileText className="mr-2 h-4 w-4" />
              Content ({content?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="lessons">
              <BookOpen className="mr-2 h-4 w-4" />
              Lessons ({lessons?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Content Sources</h3>
              <Button onClick={() => setShowAddContent(!showAddContent)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Content
              </Button>
            </div>

            {showAddContent && (
              <Card>
                <CardContent className="pt-6">
                  <AddContentForm
                    skillId={skill.id}
                    onSuccess={handleAddContent}
                    onCancel={() => setShowAddContent(false)}
                    onLessonGenerated={handleLessonGenerated}
                  />
                </CardContent>
              </Card>
            )}

            {(!content || content.length === 0) ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No content yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add content sources to generate lessons from, or generate a lesson from the skill description
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setShowAddContent(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Content
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleGenerateLesson()}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate from Skill Info
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {content.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded capitalize">
                              {item.content_type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {item.source_value}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleGenerateLesson(item.id)}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate Lesson
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {content.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Generate a lesson from all content sources combined
                    </p>
                    <Button
                      onClick={() => handleGenerateLesson()}
                      disabled={isGenerating}
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Lesson from All Content
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">
                      💡 Requires OpenAI API key configured in Supabase Edge Functions
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="lessons" className="space-y-4">
            {(!lessons || lessons.length === 0) ? (
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No lessons yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate lessons from your content sources
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {lessons.map((lesson) => (
                  <Link key={lesson.id} to={`/lessons/${lesson.id}`}>
                    <Card className="hover:bg-accent transition-colors cursor-pointer">
                      <CardHeader>
                        <CardTitle>{lesson.title}</CardTitle>
                        <CardDescription>{lesson.short_description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {lesson.learning_outcomes && lesson.learning_outcomes.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                              Learning Outcomes:
                            </p>
                            <ul className="list-disc list-inside text-xs text-muted-foreground">
                              {lesson.learning_outcomes.slice(0, 2).map((outcome, idx) => (
                                <li key={idx}>{outcome}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created: {format(new Date(lesson.created_at), "PPP")}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SkillDetail;

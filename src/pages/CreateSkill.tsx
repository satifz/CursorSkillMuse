import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { createSkill } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const CreateSkill = () => {
  const [skillName, setSkillName] = useState("");
  const [description, setDescription] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<string>("beginner");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to create a skill.",
        variant: "destructive"
      });
      return;
    }

    if (!skillName.trim()) {
      toast({
        title: "Error",
        description: "Skill name is required.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const skill = await createSkill(skillName.trim(), description.trim() || undefined, difficultyLevel);
      
      // Log the response for debugging
      console.log("Skill creation response:", skill);
      
      // Check if skill has an id
      if (!skill || !skill.id) {
        console.error("Skill created but missing ID:", skill);
        toast({
          title: "Error",
          description: "Skill created but ID is missing. Please refresh and try again.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Success!",
        description: "Skill created successfully. Now add content to generate lessons."
      });
      navigate(`/skills/${skill.id}`);
    } catch (error) {
      console.error("Error creating skill:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create skill. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Create a New Skill</CardTitle>
            <CardDescription>
              Define a skill you want to learn. You'll add content and generate lessons next.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="skillName">Skill Name *</Label>
                <Input
                  id="skillName"
                  placeholder="e.g., React Development, Data Science, Public Speaking"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  What skill do you want to learn or teach?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what this skill covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={difficultyLevel} onValueChange={setDifficultyLevel} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Skill"
                  )}
                </Button>
                <Link to="/dashboard">
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateSkill;

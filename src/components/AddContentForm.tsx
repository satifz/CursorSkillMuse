import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link as LinkIcon, FileText } from "lucide-react";
import { generateLessonFromContent } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface AddContentFormProps {
  skillId: string;
  onSuccess: () => void;
  onCancel: () => void;
  onLessonGenerated?: (lessonId: string) => void;
}

const AddContentForm = ({ skillId, onSuccess, onCancel, onLessonGenerated }: AddContentFormProps) => {
  const [sourceType, setSourceType] = useState<"url" | "text">("text");
  const [sourceValue, setSourceValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to generate lessons.",
        variant: "destructive"
      });
      return;
    }

    // Client-side validation
    const trimmedValue = sourceValue.trim();
    if (!trimmedValue) {
      if (sourceType === "url") {
        setError("Please enter a URL.");
      } else {
        setError("Please paste some content.");
      }
      return;
    }

    if (sourceType === "url") {
      // Validate URL format
      try {
        const url = new URL(trimmedValue);
        if (!['http:', 'https:'].includes(url.protocol)) {
          setError("Please enter a valid URL starting with http:// or https://.");
          return;
        }
      } catch {
        setError("Please enter a valid URL format.");
        return;
      }
    }

    setIsLoading(true);
    try {
      toast({
        title: "Generating Lesson...",
        description: "Creating AI-powered lesson from your content."
      });

      const lesson = await generateLessonFromContent(skillId, sourceType, trimmedValue);
      
      toast({
        title: "Lesson Generated!",
        description: "Your lesson has been created successfully."
      });
      
      setSourceValue(""); // Clear form
      
      if (onLessonGenerated) {
        onLessonGenerated(lesson.id);
      }

      onSuccess();
    } catch (error) {
      console.error("Error generating lesson:", error);
      
      let userFriendlyMessage = "Lesson generation failed. Please try again.";
      
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        // Check for specific error patterns
        if (errorMessage.includes('Lesson generation failed:')) {
          // Extract the actual error message after the colon
          userFriendlyMessage = errorMessage;
        } else if (errorMessage.includes('OPENAI_API_KEY') || errorMessage.includes('API key')) {
          userFriendlyMessage = "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.";
        } else if (errorMessage.includes('GENERATION_FAILED')) {
          userFriendlyMessage = errorMessage.replace('GENERATION_FAILED', 'Lesson generation failed');
        } else {
          userFriendlyMessage = errorMessage;
        }
      }
      
      setError(userFriendlyMessage);
      toast({
        title: "Error",
        description: userFriendlyMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-3 block">Add Content Source</Label>
        
        {/* Source Type Selector - Radio Buttons */}
        <div className="flex gap-4 mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="text"
              checked={sourceType === 'text'}
              onChange={(e) => {
                setSourceType(e.target.value as 'url' | 'text');
                setError("");
              }}
              className="mr-2"
              disabled={isLoading}
            />
            <FileText className="mr-2 h-4 w-4" />
            From Text
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="url"
              checked={sourceType === 'url'}
              onChange={(e) => {
                setSourceType(e.target.value as 'url' | 'text');
                setError("");
              }}
              className="mr-2"
              disabled={isLoading}
            />
            <LinkIcon className="mr-2 h-4 w-4" />
            From URL
          </label>
        </div>

        {/* Source Value Input */}
        {sourceType === 'url' ? (
          <div className="space-y-2">
            <Label htmlFor="sourceValue">Content URL</Label>
            <Input
              id="sourceValue"
              type="url"
              placeholder="https://example.com/article-or-blog"
              value={sourceValue}
              onChange={(e) => {
                setSourceValue(e.target.value);
                setError("");
              }}
              disabled={isLoading}
              required
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="sourceValue">Paste Content</Label>
            <Textarea
              id="sourceValue"
              placeholder="Paste an article, notes, or any learning material here…"
              value={sourceValue}
              onChange={(e) => {
                setSourceValue(e.target.value);
                setError("");
              }}
              disabled={isLoading}
              rows={10}
              required
              className="resize-none"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Lesson...
            </>
          ) : (
            "Generate Lesson"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default AddContentForm;

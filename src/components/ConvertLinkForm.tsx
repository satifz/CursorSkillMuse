import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { createLessonFromUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface ConvertLinkFormProps {
  onSuccess: () => void;
}

const ConvertLinkForm = ({ onSuccess }: ConvertLinkFormProps) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to generate lessons.",
        variant: "destructive"
      });
      return;
    }
    
    const trimmedUrl = url.trim();
    
    // Check if URL is empty
    if (!trimmedUrl) {
      toast({
        title: "Error",
        description: "Please enter a URL.",
        variant: "destructive"
      });
      return;
    }

    // Check if URL has valid format (starts with http:// or https://)
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      toast({
        title: "Error",
        description: "Please enter a valid URL starting with http:// or https://.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await createLessonFromUrl(trimmedUrl);
      toast({
        title: "Success!",
        description: "Your lesson has been generated successfully"
      });
      setUrl("");
      onSuccess();
    } catch (error) {
      console.error("Error creating lesson:", error);
      let errorMessage = "Failed to generate lesson. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract message from error object
        const err = error as any;
        errorMessage = err.message || err.error || JSON.stringify(error);
      }
      
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Lesson"
          )}
        </Button>
      </div>
    </form>
  );
};

export default ConvertLinkForm;

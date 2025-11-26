import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { getLessons } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Lesson {
  id: string;
  title: string;
  short_description: string;
  created_at: string;
}

interface LessonsListProps {
  refreshTrigger?: number;
}

const LessonsList = ({ refreshTrigger = 0 }: LessonsListProps) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLessons = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const data = await getLessons();
        setLessons(data);
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, [refreshTrigger, user]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No lessons yet. Create your first lesson by pasting a link above!
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {lessons.map((lesson) => (
        <Link key={lesson.id} to={`/lessons/${lesson.id}`}>
          <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {lesson.title}
            </h3>
            <p className="text-muted-foreground mb-3">
              {lesson.short_description}
            </p>
            <p className="text-sm text-muted-foreground">
              Created: {format(new Date(lesson.created_at), "PPP")}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default LessonsList;

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getSkills, getGroups, deleteSkill } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, BookOpen, Users, GraduationCap, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Skill {
  id: string;
  skill_name: string;
  description: string;
  difficulty_level: string;
  created_at: string;
}

interface Group {
  id: string;
  group_name: string;
  description: string;
  role: string;
  created_at: string;
}

const Dashboard = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const [skillsData, groupsData] = await Promise.all([
          getSkills().catch(err => {
            console.error('Error fetching skills:', err);
            return [];
          }),
          getGroups().catch(err => {
            console.error('Error fetching groups:', err);
            return [];
          })
        ]);
        setSkills(Array.isArray(skillsData) ? skillsData : []);
        setGroups(Array.isArray(groupsData) ? groupsData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDeleteClick = (skillId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSkillToDelete(skillId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!skillToDelete) return;

    setIsDeleting(true);
    try {
      await deleteSkill(skillToDelete);
      toast({
        title: "Success!",
        description: "Skill deleted successfully."
      });
      // Refresh skills list
      const skillsData = await getSkills();
      setSkills(Array.isArray(skillsData) ? skillsData : []);
      setDeleteDialogOpen(false);
      setSkillToDelete(null);
    } catch (error) {
      console.error("Error deleting skill:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete skill.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your skills, groups, and learning progress
            </p>
          </div>
          <Link to="/skills/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Skill
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="skills" className="space-y-6">
          <TabsList>
            <TabsTrigger value="skills">
              <BookOpen className="mr-2 h-4 w-4" />
              My Skills
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Users className="mr-2 h-4 w-4" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="trainer">
              <GraduationCap className="mr-2 h-4 w-4" />
              Trainer Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="space-y-4">
            {skills.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No skills yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first skill to start learning!
                </p>
                <Link to="/skills/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Skill
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {skills.map((skill) => (
                  <Card key={skill.id} className="p-6 hover:bg-accent transition-colors h-full relative group">
                    <Link to={`/skills/${skill.id}`} className="block">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold text-foreground pr-8">
                          {skill.skill_name}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {skill.difficulty_level}
                        </span>
                      </div>
                      {skill.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {skill.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created: {format(new Date(skill.created_at), "PPP")}
                      </p>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={(e) => handleDeleteClick(skill.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            {groups.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create or join a group to learn together!
                </p>
                <Link to="/groups/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Group
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {groups.map((group) => (
                  <Link key={group.id} to={`/groups/${group.id}`}>
                    <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          {group.group_name}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {group.role}
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-muted-foreground text-sm mb-3">
                          {group.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created: {format(new Date(group.created_at), "PPP")}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trainer" className="space-y-4">
            <Card className="p-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Trainer Mode</h3>
              <p className="text-muted-foreground mb-4">
                Create training spaces and manage trainee progress
              </p>
              <p className="text-sm text-muted-foreground">
                Coming soon...
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Skill</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this skill? This action cannot be undone. 
                All associated content and lessons will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Dashboard;

import { BookOpen, Briefcase, Users, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const useCases = [
  {
    icon: BookOpen,
    title: "Students",
    description: "Transform textbooks and articles into engaging visual study materials",
    color: "learning-blue",
  },
  {
    icon: Briefcase,
    title: "Professionals",
    description: "Stay updated with industry news converted to digestible visual summaries",
    color: "tech-teal",
  },
  {
    icon: Users,
    title: "Content Creators",
    description: "Generate stunning infographics and visuals for social media and LinkedIn",
    color: "gold-accent",
  },
  {
    icon: Building2,
    title: "Corporate Training",
    description: "Scale employee learning with AI-powered visual training materials",
    color: "saudi-green",
  },
];

const UseCases = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-heading font-bold">
            Who Benefits from <span className="bg-gradient-primary bg-clip-text text-transparent">SkillMuse</span>?
          </h2>
          <p className="text-xl text-muted-foreground">
            Empowering diverse learners across industries and backgrounds
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {useCases.map((useCase, index) => (
            <Card 
              key={index}
              className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-soft bg-gradient-card group"
            >
              <CardContent className="pt-8 pb-8 space-y-4 text-center">
                <div className="relative inline-block">
                  <div className={`absolute inset-0 bg-${useCase.color} blur-xl opacity-30 group-hover:opacity-60 transition-opacity`}></div>
                  <useCase.icon className={`relative w-12 h-12 mx-auto text-${useCase.color}`} />
                </div>
                
                <h3 className="text-xl font-heading font-bold">{useCase.title}</h3>
                
                <p className="text-sm text-muted-foreground">{useCase.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;

import { Card } from "@/components/ui/card";
import { Presentation, BrainCircuit, Clock, Users } from "lucide-react";

const features = [
  {
    icon: Presentation,
    title: "Turn Articles into Slides",
    description: "Skip the endless scrolling. Get 5–7 visual slides for each article."
  },
  {
    icon: BrainCircuit,
    title: "Built-In Micro Quizzes",
    description: "Test your understanding with quick, AI-generated questions."
  },
  {
    icon: Clock,
    title: "Designed for Busy Professionals",
    description: "Learn in short sessions without losing the depth of the original content."
  },
  {
    icon: Users,
    title: "Ready for Teams",
    description: "In the future, share lessons with teammates and use SkillMuse for internal training."
  }
];

const Features = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Why Visual Learning with SkillMuse?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <Card 
              key={idx} 
              className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <feature.icon className="h-12 w-12 text-saudi-teal mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

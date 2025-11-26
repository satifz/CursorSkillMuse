import { Brain, Clock, Target, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: Brain,
    stat: "65%",
    label: "Better Retention",
    description: "Visual learners retain information significantly better",
  },
  {
    icon: Clock,
    stat: "3x",
    label: "Faster Learning",
    description: "Grasp complex concepts in a fraction of the time",
  },
  {
    icon: Target,
    stat: "90%",
    label: "Engagement",
    description: "Interactive visuals keep learners focused",
  },
  {
    icon: Zap,
    stat: "Instant",
    label: "Understanding",
    description: "See the big picture at a glance",
  },
];

const WhyVisualLearning = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Why <span className="bg-gradient-primary bg-clip-text text-transparent">Visual Learning</span>?
          </h2>
          <p className="text-xl text-muted-foreground">
            Science-backed benefits of learning through visuals
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <Card 
              key={index}
              className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-soft bg-gradient-card group"
            >
              <CardContent className="pt-8 pb-8 space-y-4">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-primary blur-xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                  <benefit.icon className="relative w-12 h-12 mx-auto text-primary" />
                </div>
                
                <div className="space-y-1">
                  <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {benefit.stat}
                  </div>
                  <div className="text-lg font-semibold">{benefit.label}</div>
                </div>
                
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyVisualLearning;
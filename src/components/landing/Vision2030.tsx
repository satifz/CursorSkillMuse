import { Card } from "@/components/ui/card";
import { Cpu, Rocket, GraduationCap } from "lucide-react";

const Vision2030 = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-saudi-green/10 via-saudi-teal/10 to-transparent" />
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Aligned with Saudi Vision 2030
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            SkillMuse supports Saudi Arabia's Vision 2030 by using AI to enhance digital learning, empower professionals with continuous upskilling, and contribute to a knowledge-based economy. Built in Riyadh, SkillMuse showcases how intelligent tools can turn information overload into structured, visual learning.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card/50 backdrop-blur border-saudi-green/20">
            <Rocket className="h-10 w-10 text-saudi-green mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Digital Transformation
            </h3>
            <p className="text-muted-foreground">
              Leveraging AI to modernize education and training
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-saudi-teal/20">
            <Cpu className="h-10 w-10 text-saudi-teal mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              AI & Innovation
            </h3>
            <p className="text-muted-foreground">
              Pioneering intelligent learning solutions for the future
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-saudi-blue/20">
            <GraduationCap className="h-10 w-10 text-saudi-blue mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Human Capability Development
            </h3>
            <p className="text-muted-foreground">
              Empowering professionals with continuous learning
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Vision2030;

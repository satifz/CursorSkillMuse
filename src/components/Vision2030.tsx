import { GraduationCap, Lightbulb, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const visionPillars = [
  {
    icon: GraduationCap,
    title: "Education",
    description: "Empowering learners with cutting-edge AI technology",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Pioneering visual learning solutions for the future",
  },
  {
    icon: Zap,
    title: "Digital Transformation",
    description: "Accelerating knowledge accessibility across the Kingdom",
  },
];

const Vision2030 = () => {
  return (
    <section className="py-24 bg-gradient-saudi relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-9xl font-heading font-bold">
          2030
        </div>
      </div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white">
            Aligned with Saudi Vision 2030
          </h2>
          <p className="text-xl text-white/90">
            Driving educational excellence and digital transformation across the Kingdom
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {visionPillars.map((pillar, index) => (
            <Card 
              key={index}
              className="bg-white/95 backdrop-blur border-0 hover:bg-white transition-all duration-300 hover:shadow-glow group"
            >
              <CardContent className="pt-8 pb-8 space-y-4 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gold-accent blur-xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                  <pillar.icon className="relative w-12 h-12 mx-auto text-saudi-green" />
                </div>
                
                <h3 className="text-xl font-heading font-bold text-saudi-green">
                  {pillar.title}
                </h3>
                
                <p className="text-sm text-muted-foreground">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Vision2030;

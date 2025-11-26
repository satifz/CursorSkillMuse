import { Sparkles, Users, TrendingUp } from "lucide-react";

const reasons = [
  {
    icon: Sparkles,
    title: "AI Leadership",
    description: "Saudi Arabia is investing heavily in AI and emerging technologies",
  },
  {
    icon: Users,
    title: "Young Population",
    description: "Over 70% under age 35, eager to adopt digital learning solutions",
  },
  {
    icon: TrendingUp,
    title: "Innovation Hub",
    description: "Fast-growing startup ecosystem and government support for EdTech",
  },
];

const WhySaudi = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container px-4 mx-auto">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-heading font-bold">
              Why <span className="bg-gradient-saudi bg-clip-text text-transparent">Saudi Arabia</span> is the Ideal Launch Hub
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The Kingdom offers the perfect ecosystem for AI-powered EdTech innovation
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {reasons.map((reason, index) => (
              <div 
                key={index}
                className="text-center space-y-4 p-6 rounded-2xl bg-white border-2 border-saudi-green/20 hover:border-saudi-green/50 transition-all duration-300 hover:shadow-soft"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-saudi">
                  <reason.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold text-saudi-green">
                  {reason.title}
                </h3>
                <p className="text-sm text-muted-foreground">{reason.description}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-card rounded-2xl p-8 border border-primary/20 text-center">
            <p className="text-lg text-foreground">
              <span className="font-heading font-bold text-saudi-green">Built in Riyadh</span> for learners across the Kingdom and the world. 
              SkillMuse combines global AI innovation with local cultural understanding.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhySaudi;

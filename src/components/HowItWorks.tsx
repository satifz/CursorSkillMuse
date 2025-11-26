import { Link2, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Link2,
    title: "Paste a Link or Choose a Topic",
    description: "Users enter a webpage URL or pick a pre-selected topic. The AI reads and understands the content automatically.",
    step: "Step 1 — Input",
  },
  {
    icon: Sparkles,
    title: "AI Generates a Visual Learning Module",
    description: "The platform converts the webpage into slides, flowcharts, summary cards, and micro-quizzes.",
    step: "Step 2 — AI Visualizes Knowledge",
  },
  {
    icon: TrendingUp,
    title: "Learn, Quiz, and Track Your Progress",
    description: "Users see visual lessons, take quick quizzes, and build their learning streak. The module updates automatically when new content appears online.",
    step: "Step 3 — Learn & Progress",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-subtle relative overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-heading font-bold">
            How <span className="bg-gradient-primary bg-clip-text text-transparent">SkillMuse</span> Works
          </h2>
          <p className="text-xl text-muted-foreground">
            Three simple steps to transform any content into visual knowledge
          </p>
          <p className="text-sm text-tech-teal font-medium">
            Powered by AI Visual Intelligence
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <Card 
              key={index}
              className="relative group border-2 border-border hover:border-tech-teal/50 transition-all duration-500 hover:shadow-glow bg-card animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardContent className="pt-12 pb-8 text-center space-y-4">
                <div className="text-xs font-bold text-gold-accent uppercase tracking-wider mb-2">
                  {step.step}
                </div>
                
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-tech-teal blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                </div>
                
                <h3 className="text-xl font-heading font-bold mt-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-primary opacity-50 z-10"></div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import heroVisual from "@/assets/hero-visual.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-subtle">
      <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
      
      <div className="container relative z-10 px-4 py-20 mx-auto text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-card border border-primary/20 rounded-full shadow-soft">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI-Powered Visual Learning</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight">
            Turn Any Webpage into a{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Visual Lesson
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            See what you learn. Learn what you love.
          </p>
          
          <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto font-arabic" dir="rtl">
            تعلم كل شيء بصرياً – منصة تعليمية مدعومة بالذكاء الاصطناعي
          </p>
          
          <p className="text-sm text-muted-foreground/70 max-w-2xl mx-auto italic">
            Built in Riyadh, designed for the Kingdom & beyond
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-glow transition-all duration-300 hover:scale-105"
            >
              Start Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-2 border-tech-teal hover:bg-tech-teal/10 hover:shadow-glow transition-all duration-300 hover:scale-105"
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              }}
            >
              See How It Works
            </Button>
          </div>
          
          <div className="pt-12">
            <img 
              src={heroVisual} 
              alt="Visual Learning Platform" 
              className="w-full max-w-3xl mx-auto rounded-2xl shadow-card hover:shadow-glow transition-all duration-500"
            />
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </section>
  );
};

export default Hero;
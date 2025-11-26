import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-saudi-green/5 via-saudi-teal/5 to-saudi-blue/5" />
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-6 border-saudi-green text-saudi-green">
            AI Visual Learning • Built in Riyadh
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 animate-fade-in">
            See what you learn.<br />
            Learn what you love.
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
            SkillMuse turns long articles into quick, visual lessons with AI — so busy professionals can learn faster and remember more.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Link to="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
              onClick={scrollToHowItWorks}
            >
              See How It Works
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

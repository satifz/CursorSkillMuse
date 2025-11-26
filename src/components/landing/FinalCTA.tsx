import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-saudi-green/10 via-saudi-teal/10 to-saudi-blue/10">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          Ready to see your next article as a visual lesson?
        </h2>
        
        <Link to="/dashboard">
          <Button size="lg" className="text-lg px-8 py-6 mb-4">
            Go to Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        
        <p className="text-muted-foreground">
          Start with a free account. No credit card required.
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;

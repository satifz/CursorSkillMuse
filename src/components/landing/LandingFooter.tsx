import { Link } from "react-router-dom";

const LandingFooter = () => {
  return (
    <footer className="border-t border-border py-12 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-foreground font-semibold text-lg mb-2">SkillMuse</p>
            <p className="text-muted-foreground text-sm">
              © 2025 SkillMuse. All rights reserved.
            </p>
          </div>
          
          <div className="flex gap-6 text-sm">
            <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Prototype build. Not all features are live yet.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    description: "Get started with basic features",
    features: [
      "Convert limited lessons per month",
      "Basic visual lessons",
      "Quiz functionality"
    ],
    highlighted: true,
    cta: "Start Free"
  },
  {
    name: "Pro",
    comingSoon: true,
    description: "For power users",
    features: [
      "Unlimited visual lessons",
      "Advanced analytics",
      "Export capabilities",
      "Priority support"
    ],
    cta: "Coming Soon"
  },
  {
    name: "Teams",
    comingSoon: true,
    description: "Perfect for training and L&D",
    features: [
      "Team spaces",
      "Shared lesson libraries",
      "Admin dashboard",
      "Custom integrations"
    ],
    cta: "Coming Soon"
  }
];

const PricingTeaser = () => {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Simple Plans for Individuals and Teams
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <Card 
              key={idx} 
              className={`p-8 relative ${
                plan.highlighted ? 'border-saudi-green border-2 shadow-lg' : ''
              }`}
            >
              {plan.comingSoon && (
                <div className="absolute top-4 right-4">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-foreground mb-2">
                {plan.name}
              </h3>
              <p className="text-muted-foreground mb-6">
                {plan.description}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIdx) => (
                  <li key={featureIdx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-saudi-green mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                variant={plan.highlighted ? "default" : "outline"}
                disabled={plan.comingSoon}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingTeaser;

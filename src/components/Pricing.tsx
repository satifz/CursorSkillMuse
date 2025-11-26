import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for casual learners",
    features: [
      "View public visuals",
      "3 personal conversions/month",
      "Basic flashcards",
      "Community support",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For serious learners",
    features: [
      "Unlimited conversions",
      "Download visuals (PNG, PPT)",
      "Advanced quizzes",
      "Priority support",
      "Remove watermarks",
    ],
    cta: "Start Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$29",
    period: "/month",
    description: "For teams & educators",
    features: [
      "Everything in Pro",
      "Shared workspace",
      "Custom branding",
      "Analytics dashboard",
      "Team management",
      "Dedicated support",
    ],
    cta: "Start Team",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Simple <span className="bg-gradient-primary bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Choose the plan that fits your learning journey
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative ${
                plan.highlighted 
                  ? "border-primary shadow-glow scale-105" 
                  : "border-2 hover:border-primary/50"
              } transition-all duration-300`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-primary text-white text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              
              <CardHeader className="text-center space-y-4 pt-8">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    plan.highlighted 
                      ? "bg-gradient-primary hover:opacity-90 shadow-glow" 
                      : "bg-primary hover:bg-primary/90"
                  }`}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
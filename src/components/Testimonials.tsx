import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Student, MIT",
    content: "SkillMuse transformed how I study. Complex research papers become clear visual summaries in seconds. Game changer!",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Product Manager",
    content: "I use SkillMuse daily to digest industry articles. The visual mind maps help me connect ideas faster than ever.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Content Creator",
    content: "Creating educational content is so much easier now. The AI-generated visuals are perfect for my LinkedIn posts.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Software Engineer",
    content: "Best learning tool I've found. Technical documentation becomes interactive and actually enjoyable to learn from.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Loved by <span className="bg-gradient-primary bg-clip-text text-transparent">Learners</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands who've transformed their learning experience
          </p>
        </div>
        
        <Carousel className="max-w-5xl mx-auto">
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2">
                <Card className="border-2 hover:border-primary/50 transition-all duration-300 h-full">
                  <CardContent className="pt-8 space-y-4">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                      ))}
                    </div>
                    
                    <p className="text-lg">{testimonial.content}</p>
                    
                    <div className="pt-4 border-t">
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
};

export default Testimonials;
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import sampleVisual1 from "@/assets/sample-visual-1.png";
import sampleVisual2 from "@/assets/sample-visual-2.png";
import sampleVisual3 from "@/assets/sample-visual-3.png";

const samples = [
  {
    image: sampleVisual1,
    title: "Technology Mind Map",
    description: "Complex tech concepts visualized",
  },
  {
    image: sampleVisual2,
    title: "Business Strategy",
    description: "Strategic frameworks made simple",
  },
  {
    image: sampleVisual3,
    title: "Design Thinking",
    description: "Creative process step-by-step",
  },
];

const SampleGallery = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Visual <span className="bg-gradient-primary bg-clip-text text-transparent">Examples</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            See how complex content transforms into beautiful, digestible visuals
          </p>
        </div>
        
        <Carousel className="max-w-5xl mx-auto">
          <CarouselContent>
            {samples.map((sample, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-card group">
                  <CardContent className="p-4 space-y-4">
                    <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                      <img 
                        src={sample.image} 
                        alt={sample.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">{sample.title}</h3>
                      <p className="text-sm text-muted-foreground">{sample.description}</p>
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

export default SampleGallery;
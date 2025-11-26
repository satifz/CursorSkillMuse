import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does SkillMuse work?",
    answer: "Simply paste any article URL or let our AI fetch trending content. Our AI extracts key concepts and automatically generates beautiful visual explanations including slides, mind maps, and infographics.",
  },
  {
    question: "What types of content can I convert?",
    answer: "SkillMuse works with any text-based web content - articles, blog posts, research papers, documentation, and more. We support all major websites and can fetch content from RSS feeds.",
  },
  {
    question: "Can I customize the generated visuals?",
    answer: "Yes! Pro and Team users can edit titles, captions, and layouts before publishing. You can also download visuals in multiple formats (PNG, PPT) for further customization.",
  },
  {
    question: "Is there a limit on conversions?",
    answer: "Free users get 3 conversions per month. Pro users enjoy unlimited conversions. Team plans include shared workspaces for collaborative learning.",
  },
  {
    question: "How accurate is the AI summarization?",
    answer: "Our AI uses advanced language models to extract key concepts while maintaining context and accuracy. Each visual includes links to the original source for reference.",
  },
  {
    question: "Can I share my visual lessons?",
    answer: "Absolutely! All visuals can be shared via direct links or embedded on your website. Pro users can also remove watermarks and add custom branding.",
  },
];

const FAQ = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Frequently Asked <span className="bg-gradient-primary bg-clip-text text-transparent">Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about SkillMuse
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border-2 rounded-xl px-6 bg-card hover:border-primary/50 transition-colors"
              >
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
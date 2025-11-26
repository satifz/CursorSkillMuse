import { User, Zap, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProductFoundation = () => {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="container max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-heading font-bold text-foreground">
            SkillMuse <span className="text-saudi-green">Foundation</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            AI Visual Learning Platform — MVP Definition
          </p>
        </div>

        {/* User Persona Block */}
        <Card className="border-2 border-tech-teal/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tech-teal to-learning-blue flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-heading">
                User Persona (MVP Target User)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg leading-relaxed text-foreground">
              <strong className="text-saudi-green">SkillMuse MVP</strong> is designed for{" "}
              <strong>working professionals</strong> who regularly read online articles 
              and want to convert them into quick visual lessons they can remember and reuse.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-tech-teal">
              <p className="text-sm text-muted-foreground">
                <strong>Key Characteristics:</strong>
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Time-conscious professionals seeking efficient learning</li>
                <li>Active online readers (articles, blogs, research papers)</li>
                <li>Visual learners who retain information better through diagrams</li>
                <li>Need to quickly reference and share key takeaways</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Golden Use Case Block */}
        <Card className="border-2 border-gold-accent/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-accent to-saudi-green flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-heading">
                Golden Use Case (v1 MVP)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg leading-relaxed text-foreground">
              A professional logs into SkillMuse, pastes a link to an article, 
              and the AI instantly creates a visual learning lesson.
            </p>

            <div className="bg-gradient-to-r from-saudi-green/5 to-tech-teal/5 rounded-lg p-6 space-y-4">
              <p className="font-semibold text-foreground">
                The AI-generated lesson includes:
              </p>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-tech-teal/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-tech-teal">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">5–7 Visual Slides</p>
                    <p className="text-sm text-muted-foreground">
                      Key concepts broken down into digestible visual cards
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-learning-blue/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-learning-blue">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Short Summary</p>
                    <p className="text-sm text-muted-foreground">
                      Concise overview of the article's main points
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold text-gold-accent">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">3–5 Micro-Quiz Questions</p>
                    <p className="text-sm text-muted-foreground">
                      Interactive questions to test understanding and retention
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-saudi-green/5 rounded-lg p-4 border border-saudi-green/20">
              <p className="text-sm font-semibold text-saudi-green">
                🎯 This is the single main action SkillMuse must perform.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Placeholder */}
        <Card className="border-2 border-muted shadow-lg bg-muted/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted-foreground to-muted flex items-center justify-center">
                <Brain className="w-6 h-6 text-background" />
              </div>
              <CardTitle className="text-2xl font-heading text-muted-foreground">
                Next: Define Brain Output
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Define the <strong>Lesson JSON Structure</strong> that the AI will generate 
              when processing an article. This will include the schema for slides, 
              summary content, and quiz questions.
            </p>
            <div className="mt-4 p-4 bg-background rounded-lg border border-border">
              <p className="text-sm text-muted-foreground font-mono">
                // Placeholder for Lesson JSON Schema
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductFoundation;

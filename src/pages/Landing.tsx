import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Zap, Users, Share2, Brain, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate("/chat");
    } else {
      navigate("/auth");
    }
  };

  const freeFeatures = [
    { name: "5 queries/month", included: true },
    { name: "Gemini Flash Lite", included: true },
    { name: "GPT-5 Nano", included: true },
    { name: "Deep Mode", included: false },
    { name: "All AI Models", included: false },
    { name: "Community Access", included: false },
    { name: "Share Results", included: false },
    { name: "Export Results", included: false },
  ];

  const proFeatures = [
    { name: "Unlimited queries", included: true },
    { name: "All AI Models", included: true },
    { name: "Deep Mode", included: true },
    { name: "Community Access", included: true },
    { name: "Share Results", included: true },
    { name: "Export Results", included: true },
    { name: "Priority Support", included: true },
    { name: "Early Access Features", included: true },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">DML Arena</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate("/chat")} variant="default">
                Go to Chat
              </Button>
            ) : (
              <>
                <Button onClick={() => navigate("/auth")} variant="ghost">
                  Sign In
                </Button>
                <Button onClick={() => navigate("/auth")} variant="default">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              DML Arena: The Open-Source LLM Battleground
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
              <span className="gradient-text">Battle of the</span>
              <br />
              <span className="text-foreground">AI Titans</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              watch top-tier AI models (Claude Opus 4.6, GPT-5.3, Gemini 3.1 Pro) fight for the best response 
              Discover which AI thinks best for your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="gap-2">
                <Zap className="w-4 h-4" />
                Start Comparing Free
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 border-t border-border/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why <span className="gradient-text">DML Arena</span>?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Brain, title: "55+ AI Models", desc: "GPT-5, Claude 4.5, Gemini 3, DeepSeek R1, Grok 4 & more" },
              { icon: MessageSquare, title: "Deep Mode", desc: "Multi-round debates between AIs" },
              { icon: Users, title: "Community", desc: "Share and vote on comparisons" },
              { icon: Share2, title: "11 Export Formats", desc: "PDF, JSON, YAML, CSV, SQLite & more" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start free and upgrade when you need more power
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-card/50 border-border/50 backdrop-blur-sm h-full">
                <CardHeader>
                  <CardTitle className="text-2xl">Free</CardTitle>
                  <CardDescription>Perfect for trying out DML Arena</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {freeFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-primary shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className={feature.included ? "text-foreground" : "text-muted-foreground/50"}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6" 
                    variant="outline"
                    onClick={handleGetStarted}
                  >
                    Get Started Free
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="relative bg-card/50 border-primary/50 backdrop-blur-sm h-full glow-effect">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl gradient-text">Pro</CardTitle>
                  <CardDescription>For power users who need more</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$15</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {proFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-foreground">{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6" 
                    onClick={handleGetStarted}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to find the <span className="gradient-text">best AI</span>?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of users comparing AI models every day
          </p>
          <Button size="lg" onClick={handleGetStarted}>
            Start Free Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-10">
        <div className="container mx-auto px-4 flex flex-col items-center gap-3 text-muted-foreground text-sm">
          <p className="font-medium text-foreground/80">Developed by <span className="gradient-text font-semibold">DML Labs</span></p>
          <p className="flex items-center gap-1.5">
            Lead Engineer:{' '}
            <a
              href="https://github.com/devmayank-official"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
              devmayank-official
            </a>
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">© 2026 DML Arena. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;


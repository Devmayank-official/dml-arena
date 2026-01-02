import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, ChevronLeft, HelpCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = (plan: 'free' | 'pro') => {
    if (user) {
      navigate("/chat");
    } else {
      navigate("/auth");
    }
  };

  const features = [
    { name: "Monthly Queries", free: "5", pro: "Unlimited" },
    { name: "GPT-5 Nano", free: true, pro: true },
    { name: "Gemini Flash Lite", free: true, pro: true },
    { name: "GPT-5", free: false, pro: true },
    { name: "GPT-5 Mini", free: false, pro: true },
    { name: "Gemini 2.5 Pro", free: false, pro: true },
    { name: "Gemini 3 Pro", free: false, pro: true },
    { name: "Gemini 2.5 Flash", free: false, pro: true },
    { name: "Deep Mode (AI Debates)", free: false, pro: true },
    { name: "Community Access", free: false, pro: true },
    { name: "Share Results", free: false, pro: true },
    { name: "Export (PDF, JSON, etc.)", free: false, pro: true },
    { name: "Response History", free: "Limited", pro: "Unlimited" },
    { name: "Priority Support", free: false, pro: true },
    { name: "Early Access Features", free: false, pro: true },
  ];

  const faqs = [
    {
      question: "What happens when I reach my free limit?",
      answer: "Once you've used your 5 free queries for the month, you'll need to wait until the next month for your limit to reset, or upgrade to Pro for unlimited queries."
    },
    {
      question: "Which AI models are included in the free plan?",
      answer: "The free plan includes GPT-5 Nano and Gemini Flash Lite - both are fast, capable models perfect for quick comparisons. Pro unlocks all 7 models including GPT-5, Gemini 2.5 Pro, and Gemini 3 Pro."
    },
    {
      question: "What is Deep Mode?",
      answer: "Deep Mode enables multi-round debates between AI models. Instead of single responses, models discuss and challenge each other over multiple rounds, then synthesize the best answer. It's perfect for complex questions where you want thorough analysis."
    },
    {
      question: "Can I cancel my Pro subscription anytime?",
      answer: "Yes! You can cancel anytime. Your Pro features will remain active until the end of your billing period, then you'll automatically switch to the free plan."
    },
    {
      question: "What export formats are available?",
      answer: "Pro users can export comparisons as PDF (for printing/sharing), JSON (for developers), YAML, XML, and Markdown. Perfect for documentation, reports, or integrating results into your workflow."
    },
    {
      question: "Is my data private?",
      answer: "Yes, your queries and results are private by default. Only you can see your comparison history. If you choose to share a result, it becomes accessible via a unique link - but you control what gets shared."
    },
    {
      question: "Do queries reset monthly?",
      answer: "Yes, free plan queries reset at the beginning of each calendar month. Pro users have unlimited queries, so no reset needed!"
    },
    {
      question: "Can I try Pro features before subscribing?",
      answer: "Currently we don't offer a trial, but the free plan lets you experience the core comparison feature. If you love it, Pro unlocks the full power of AI Arena."
    },
  ];

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "string") {
      return <span className="text-foreground font-medium">{value}</span>;
    }
    return value ? (
      <Check className="h-5 w-5 text-primary mx-auto" />
    ) : (
      <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />
    );
  };

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
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">AI Arena</span>
            </Link>
          </div>
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
      <section className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Start free, upgrade when you need more power. No hidden fees.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 pb-16">
        <div className="container mx-auto px-4">
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
                  <CardDescription>Perfect for trying out AI Arena</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>5 queries per month</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>GPT-5 Nano model</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>Gemini Flash Lite model</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>Basic comparison features</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleGetStarted('free')}
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
                    <span className="text-5xl font-bold">$15</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>Unlimited queries</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>All 7 AI models</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>Deep Mode (AI debates)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>Community, Share & Export</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={() => handleGetStarted('pro')}
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

      {/* Feature Comparison Table */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-center mb-4">
              Compare <span className="gradient-text">Plans</span>
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              See exactly what you get with each plan
            </p>

            <div className="max-w-3xl mx-auto overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="w-[50%]">Feature</TableHead>
                    <TableHead className="text-center">Free</TableHead>
                    <TableHead className="text-center">
                      <span className="gradient-text font-semibold">Pro</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.map((feature, index) => (
                    <TableRow key={index} className="border-border/30">
                      <TableCell className="font-medium">{feature.name}</TableCell>
                      <TableCell className="text-center">
                        {renderFeatureValue(feature.free)}
                      </TableCell>
                      <TableCell className="text-center bg-primary/5">
                        {renderFeatureValue(feature.pro)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold">
                Frequently Asked <span className="gradient-text">Questions</span>
              </h2>
            </div>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Got questions? We've got answers.
            </p>

            <div className="max-w-2xl mx-auto">
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="border border-border/50 rounded-lg px-4 bg-card/30 backdrop-blur-sm"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <span className="font-medium">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to unlock the full <span className="gradient-text">power</span>?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands comparing AI models every day
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => handleGetStarted('pro')}>
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
            <Button size="lg" variant="outline" onClick={() => handleGetStarted('free')}>
              Start Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          © 2026 AI Arena. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Pricing;

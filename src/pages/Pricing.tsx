import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, ChevronLeft, HelpCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";
import { PaymentButton } from "@/components/PaymentButton";
import { BillingCycle } from "@/hooks/useRazorpay";
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
  const { isPro, refetch } = useSubscription();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const handleGetStarted = () => {
    if (user) {
      navigate("/chat");
    } else {
      navigate("/auth");
    }
  };

  const monthlyPrice = '₹1,500';
  const yearlyPrice = '₹15,300';
  const yearlyMonthly = '₹1,275';

  const features = [
    { name: "Monthly Credits", free: "5", pro: "1,000" },
    { name: "Per Minute Limit", free: "2", pro: "10" },
    { name: "Per Hour Limit", free: "5", pro: "100" },
    { name: "Per Day Limit", free: "5", pro: "300" },
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
      question: "What are the rate limits?",
      answer: "Free plan: 2 requests per minute, 5 per hour, 5 per day, and 5 per month. Pro plan: 10 per minute, 100 per hour, 300 per day, and 1,000 per month. These limits ensure fair usage and system stability."
    },
    {
      question: "What happens when I hit a rate limit?",
      answer: "If you hit a per-minute limit, just wait a few seconds. Hourly limits reset within the hour. Daily limits reset at midnight. Monthly limits reset on the 1st of each month. Upgrade to Pro for significantly higher limits!"
    },
    {
      question: "Which AI models are included in the free plan?",
      answer: "The free plan includes GPT-5 Nano and Gemini Flash Lite - both are fast, capable models perfect for quick comparisons. Pro unlocks all 55+ models including GPT-5, Claude 4.5, Gemini 3 Pro, DeepSeek R1, Grok 4, and many more from 14 providers."
    },
    {
      question: "What is Deep Mode?",
      answer: "Deep Mode enables multi-round debates between AI models. Instead of single responses, models discuss and challenge each other over multiple rounds, then synthesize the best answer. It's perfect for complex questions where you want thorough analysis."
    },
    {
      question: "Can I cancel my Pro subscription anytime?",
      answer: "Yes! You can cancel anytime from Settings. Your Pro features will remain active until the end of your billing period, then you'll automatically switch to the free plan."
    },
    {
      question: "What's the difference between Monthly and Yearly billing?",
      answer: "Yearly billing saves you 15%! Monthly is ₹1,500/month. Yearly is ₹15,300/year (effectively ₹1,275/month). Both plans include the same 1,000 credits/month and all Pro features."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept all major payment methods through Razorpay: Credit/Debit Cards (Visa, Mastercard, RuPay), UPI, Net Banking, and Wallets. All payments are securely processed."
    },
    {
      question: "Is my data private?",
      answer: "Yes, your queries and results are private by default. Only you can see your comparison history. If you choose to share a result, it becomes accessible via a unique link - but you control what gets shared."
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
              <span className="text-xl font-bold gradient-text">DML Arena</span>
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
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Start free, upgrade when you need more power. No hidden fees.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Yearly
                <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  Save 15%
                </Badge>
              </button>
            </div>
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
                  <CardDescription>Perfect for trying out DML Arena</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">₹0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>5 credits per month</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>2 requests per minute</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>GPT-5 Nano & Gemini Flash Lite</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>Basic comparison features</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
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
                    {billingCycle === 'yearly' ? (
                      <>
                        <span className="text-5xl font-bold">{yearlyMonthly}</span>
                        <span className="text-muted-foreground">/month</span>
                        <div className="mt-1">
                          <span className="text-sm text-muted-foreground line-through mr-2">₹18,000/yr</span>
                          <span className="text-sm text-green-400 font-medium">{yearlyPrice}/yr</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-5xl font-bold">{monthlyPrice}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>1,000 credits per month</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>10 req/min • 100/hr • 300/day</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>All 55+ AI models</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0" />
                      <span>Deep Mode, Share & Export</span>
                    </li>
                  </ul>
                  {isPro ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : user ? (
                    <PaymentButton
                      billingCycle={billingCycle}
                      onSuccess={() => refetch()}
                      className="w-full"
                      size="default"
                    />
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => navigate("/auth")}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Sign Up to Upgrade
                    </Button>
                  )}
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user && !isPro ? (
              <PaymentButton
                billingCycle={billingCycle}
                onSuccess={() => refetch()}
                size="lg"
              />
            ) : (
              <Button size="lg" onClick={handleGetStarted}>
                <Sparkles className="w-4 h-4 mr-2" />
                {isPro ? 'Go to Chat' : 'Upgrade to Pro'}
              </Button>
            )}
            {!user && (
              <Button size="lg" variant="outline" onClick={handleGetStarted}>
                Start Free
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          © 2026 DML Arena. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export { Pricing };
export default Pricing;

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Brain, 
  Building2, 
  Check, 
  Heart, 
  Zap, 
  Target, 
  Layers,
  Users,
  Palette,
  Sparkles,
  Layout
} from "lucide-react";
import { Link } from "wouter";
import { AluhicLogo } from "@/components/AluhicLogo";

export default function DesignSystemLanding() {
  const designPrinciples = [
    "Enterprise-first, clinical clarity",
    "Grid-based 8pt layout system",
    "Role-based UI optimization",
    "WCAG AA compliant contrast"
  ];

  const coreValues = [
    { icon: Heart, title: "Trust", description: "Clinical credibility" },
    { icon: Brain, title: "Intelligence", description: "AI-driven insights" },
    { icon: Zap, title: "Efficiency", description: "Workflow optimization" },
    { icon: Layers, title: "Scalability", description: "Enterprise ready" }
  ];

  const stats = [
    { value: "5", label: "User Roles", icon: Users },
    { value: "18+", label: "Icon Types", icon: Sparkles },
    { value: "4", label: "Logo Variants", icon: Layout },
    { value: "5", label: "Core Colors", icon: Palette }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <AluhicLogo size="lg" />
          <Link href="/login">
            <Button data-testid="button-login">Sign In</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
          <div className="mx-auto max-w-4xl space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Aluhic Design System
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              AI-Powered Healthcare & Pharma Operations Platform
            </p>
            <p className="text-lg text-primary font-medium">
              "Your Medical Partner"
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Badge variant="secondary" className="px-4 py-2 text-sm gap-2">
                <Shield className="h-4 w-4" />
                Healthcare Credibility
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm gap-2">
                <Brain className="h-4 w-4" />
                AI Intelligence
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm gap-2">
                <Building2 className="h-4 w-4" />
                Enterprise Grade
              </Badge>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Design Principles</h2>
              <ul className="space-y-4">
                {designPrinciples.map((principle, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="text-muted-foreground">{principle}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Core Values</h2>
              <ul className="space-y-4">
                {coreValues.map((value, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <value.icon className="h-3 w-3" />
                    </div>
                    <div>
                      <span className="font-semibold">{value.title}</span>
                      <span className="text-muted-foreground"> – {value.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        <section className="bg-muted/50 py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Explore the Design System</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Navigate through the sidebar to explore logo variants, color palettes, 
              UI components, and role-based dashboard examples for different user types.
            </p>
            <Link href="/login">
              <Button size="lg" data-testid="button-get-started">
                Get Started
                <Target className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center p-6">
                <CardContent className="p-0 space-y-2">
                  <stat.icon className="h-8 w-8 mx-auto text-primary" />
                  <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Aluhic - AI-Powered Healthcare & Pharma Operations Platform</p>
        </div>
      </footer>
    </div>
  );
}

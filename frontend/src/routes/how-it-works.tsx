import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Brain,
  CalendarCheck,
  Gauge,
  Languages,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const agents = [
  {
    icon: ScanLine,
    step: "01",
    title: "Extraction agent",
    what: "Reads the photo of your lab report.",
    detail:
      "It finds every test name, its value, the unit and the normal reference range, then flags each result as normal, high or low.",
  },
  {
    icon: Brain,
    step: "02",
    title: "Interpretation agent",
    what: "Turns numbers into plain language.",
    detail:
      "Each flagged value is explained twice — once in simple English and once in Urdu — along with a practical next step you can actually follow.",
  },
  {
    icon: Gauge,
    step: "03",
    title: "Urgency agent",
    what: "Decides how soon you should act.",
    detail:
      "Results are rated Routine, Needs Attention or Urgent, with a short reason so you know why that rating was given.",
  },
  {
    icon: CalendarCheck,
    step: "04",
    title: "Scheduling agent",
    what: "Suggests the right doctor.",
    detail:
      "Based on the urgency and the specialty involved, it picks a realistic slot at a government or private hospital and explains the choice.",
  },
];

const faqs = [
  [
    "Is this a diagnosis?",
    "No. Sehat Sahulat explains what your report says and how urgent it looks. A qualified doctor confirms and treats.",
  ],
  [
    "What images work best?",
    "A bright, flat photo where every test name and number is readable. JPEG, PNG or WEBP, under 12 MB.",
  ],
  [
    "Does it understand Urdu?",
    "Every explanation is produced in both English and Urdu, and the AI mentor replies in whichever you use.",
  ],
  [
    "What happens to my report?",
    "It is processed for the analysis and is not shared with anyone else.",
  ],
];

const trustFeatures: Array<[LucideIcon, string, string]> = [
  [Languages, "Bilingual by default", "Every explanation arrives in English and Urdu together."],
  [ShieldCheck, "Private by design", "Your report is used for the analysis and nothing else."],
  [Bot, "A mentor on call", "Follow-up questions go to the AI mentor, any time."],
];

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works | Sehat Sahulat" },
      {
        name: "description",
        content:
          "See the four AI agents that read your lab report, explain it in English and Urdu, rate urgency and suggest an appointment.",
      },
      { property: "og:title", content: "How Sehat Sahulat Works" },
      {
        property: "og:description",
        content: "Four AI agents turn a lab report photo into clear guidance.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative border-b border-border bg-gradient-to-b from-card to-background py-16 sm:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 -right-20 size-72 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-accent/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-5xl px-5 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow="Behind the scenes"
                title={
                  <>
                    Four AI agents,
                    <br />
                    one clear answer.
                  </>
                }
                subtitle="One photo goes in. It passes through four specialised agents, each doing a single job well, and comes back as an explanation you can act on."
                align="left"
              />
            </Reveal>

            <div className="relative mt-14">
              <div
                aria-hidden
                className="absolute left-6 right-6 top-10 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
              />
              <div className="space-y-6">
                {agents.map((agent, index) => (
                  <Reveal key={agent.step} delay={index * 100}>
                    <article className="relative flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-card sm:flex-row sm:items-start sm:gap-8">
                      <div className="relative flex flex-col items-center sm:flex-none sm:items-start">
                        <span className="relative z-10 grid size-14 place-items-center rounded-2xl border border-border bg-background text-primary shadow-soft">
                          <agent.icon className="size-6" aria-hidden />
                        </span>
                        <span className="absolute left-1/2 top-14 -translate-x-1/2 hidden w-px h-full bg-gradient-to-b from-transparent via-border to-transparent lg:block" />
                        <span className="mt-3 font-display text-sm font-bold text-muted-foreground">
                          {agent.step}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h2 className="font-display text-lg font-semibold tracking-tight">
                          {agent.title}
                        </h2>
                        <p className="mt-2 font-semibold text-foreground">{agent.what}</p>
                        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                          {agent.detail}
                        </p>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-5 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow="What makes it different"
                title="Built for trust, not just speed"
                subtitle="Three promises that guide every decision we make."
              />
            </Reveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trustFeatures.map(([Icon, title, body], index) => (
                <Reveal key={title} delay={index * 100}>
                  <article className="group relative h-full overflow-hidden rounded-3xl border border-border bg-background p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted">
                    <div
                      aria-hidden
                      className="absolute -right-10 -top-10 size-28 rounded-full bg-primary/10 blur-2xl transition-transform duration-300 group-hover:scale-150"
                    />
                    <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                      {React.createElement(Icon, { className: "size-5", "aria-hidden": true })}
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-5 lg:px-8">
            <Reveal>
              <SectionHeading
                eyebrow="Common questions"
                title="Still wondering?"
                subtitle="Here are the things people ask most often."
              />
            </Reveal>

            <Reveal delay={100}>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map(([question, answer]) => (
                  <AccordionItem
                    key={question}
                    value={question as string}
                    className="border-b border-border"
                  >
                    <AccordionTrigger className="text-left py-5 text-base font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                      {question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-7 text-muted-foreground">
                      {answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>

            <Reveal className="mt-10 text-center" delay={200}>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link to="/" hash="upload">
                    Analyze my report <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/mentor">Ask the AI mentor</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

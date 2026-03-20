"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { businessFacts } from "@/lib/site-data";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0f281a] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(8,20,13,0.84)_0%,rgba(8,20,13,0.64)_42%,rgba(8,20,13,0.22)_100%),url('/images/hero-lawn.svg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,232,207,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(132,204,22,0.14),transparent_26%)]" />
      <div className="container relative z-10 grid gap-10 py-20 md:py-28 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55 }}
          className="max-w-3xl space-y-7"
        >
          <Badge variant="secondary" className="bg-white/15 text-white">
            Same-day mowing and expert lawn treatments in Lubbock, Texas
          </Badge>
          <div className="space-y-4">
            <h1 className="text-balance font-display text-[2.7rem] uppercase leading-[0.94] tracking-[0.04em] text-white sm:text-[4.25rem] sm:tracking-[0.06em] lg:text-[5.6rem]">
              Same-Day Mowing &amp; Expert Treatments in Lubbock — Book in 60
              Seconds
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/78 md:text-xl">
              Lubbock Lawn Pros gives your yard a commercial-grade finish with
              owner-led service, sharp pricing, and a booking flow built to feel
              instant.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="#booking">
                Book Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/services">See Services</Link>
            </Button>
          </div>
          <div className="grid gap-3 text-sm text-white/80 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#9fe870]" />
              Huge curb appeal, fast
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#9fe870]" />
              Satisfaction guaranteed
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#9fe870]" />
              Billy & Josh on the route
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1"
        >
          {businessFacts.map((fact) => (
            <div
              key={fact.label}
              className="rounded-[28px] border border-white/12 bg-white/10 p-6 backdrop-blur-sm"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                {fact.label}
              </p>
              <p className="mt-3 font-display text-4xl uppercase tracking-[0.08em] text-[#e5ffcb]">
                {fact.value}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

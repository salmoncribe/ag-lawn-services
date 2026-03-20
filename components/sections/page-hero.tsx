"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-white/25 bg-[radial-gradient(circle_at_top_left,rgba(22,101,52,0.18),transparent_38%),linear-gradient(180deg,#fff8ee_0%,#f2eadb_100%)]">
      <div className="container py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl space-y-5"
        >
          <Badge>{eyebrow}</Badge>
          <div className="space-y-4">
            <h1 className="text-balance font-display text-[3.2rem] uppercase leading-[0.94] tracking-[0.05em] text-primary md:text-7xl md:leading-none md:tracking-[0.08em]">
              {title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              {description}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

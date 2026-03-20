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
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl space-y-5"
        >
          <Badge>{eyebrow}</Badge>
          <div className="space-y-4">
            <h1 className="font-display text-5xl uppercase leading-none tracking-[0.08em] text-primary md:text-7xl">
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

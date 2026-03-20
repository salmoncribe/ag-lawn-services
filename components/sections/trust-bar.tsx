"use client";

import { motion } from "framer-motion";
import { trustPoints } from "@/lib/site-data";

export function TrustBar() {
  return (
    <section className="border-y border-white/35 bg-secondary/70">
      <div className="container py-5">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-6"
        >
          {trustPoints.map((point, index) => (
            <div key={point} className="flex items-center gap-4">
              <span className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                {point}
              </span>
              {index < trustPoints.length - 1 ? (
                <span className="hidden h-2 w-2 rounded-full bg-primary/30 sm:block" />
              ) : null}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function SuccessCelebration() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: `${5 + index * 5}%`,
        delay: index * 0.04,
        size: 8 + (index % 4) * 4
      })),
    []
  );

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-[#d8ebb4] bg-[#f3ffe3] p-6">
      <div className="pointer-events-none absolute inset-0">
        {pieces.map((piece) => (
          <motion.span
            key={piece.id}
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 180, opacity: [0, 1, 1, 0], rotate: 240 }}
            transition={{ duration: 2.1, delay: piece.delay, ease: "easeOut" }}
            className="absolute top-0 rounded-full bg-primary/70"
            style={{
              left: piece.left,
              width: piece.size,
              height: piece.size
            }}
          />
        ))}
      </div>
      <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge>Booking confirmed</Badge>
          <h2 className="mt-3 font-display text-4xl uppercase tracking-[0.08em] text-primary">
            Stripe payment landed. Your dashboard is updated.
          </h2>
        </div>
      </div>
    </div>
  );
}

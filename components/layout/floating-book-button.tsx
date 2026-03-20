"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarPlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingBookButton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.45 }}
      className="fixed bottom-5 right-5 z-50"
    >
      <Button asChild size="lg" className="rounded-full px-5 shadow-meadow">
        <Link href="/book">
          <CalendarPlus2 className="h-5 w-5" />
          Book Now
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </motion.div>
  );
}

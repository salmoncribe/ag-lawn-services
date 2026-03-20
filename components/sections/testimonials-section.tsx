"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { testimonials } from "@/lib/site-data";

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="container space-y-10">
        <div className="max-w-2xl space-y-4">
          <Badge>Neighbors talk</Badge>
          <h2 className="font-display text-5xl uppercase tracking-[0.08em] text-primary md:text-6xl">
            The kind of reviews that close the sale fast
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">
            Realistic local-style testimonials so the site instantly feels grounded
            in Lubbock instead of generic service-brand filler.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <Card className="h-full bg-[#102f1d] text-white">
                <CardContent className="flex h-full flex-col gap-5 p-7">
                  <Quote className="h-8 w-8 text-[#d5ff9d]" />
                  <p className="text-lg leading-8 text-white/85">
                    “{testimonial.quote}”
                  </p>
                  <div className="mt-auto">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm uppercase tracking-[0.2em] text-white/55">
                      {testimonial.neighborhood}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

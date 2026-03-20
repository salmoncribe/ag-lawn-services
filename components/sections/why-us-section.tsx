"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { whyUsItems } from "@/lib/site-data";

export function WhyUsSection() {
  return (
    <section className="bg-white/45 py-20">
      <div className="container space-y-10">
        <div className="max-w-2xl space-y-4">
          <Badge>Why people trust Billy & Josh</Badge>
          <h2 className="font-display text-5xl uppercase tracking-[0.08em] text-primary md:text-6xl">
            Built to look buttoned-up from the driveway in
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">
            Clean rigs, consistent finish quality, and fast communication are what
            make a two-man crew feel like a much bigger operation.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {whyUsItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <Card className="h-full overflow-hidden">
                <div className="relative h-56 w-full bg-[#edf7eb]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-[2rem]">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-7 text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { serviceCatalog } from "@/lib/site-data";

const teaserIds = [
  "premium-mow",
  "fertilize",
  "mow-fertilize-bundle",
  "biweekly-mowing"
] as const;

const teaserIdSet = new Set<string>(teaserIds);

export function ServicesPreview() {
  const teaserServices = serviceCatalog.filter((service) =>
    teaserIdSet.has(service.id)
  );

  return (
    <section className="py-20">
      <div className="container space-y-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge>What people book first</Badge>
            <h2 className="font-display text-5xl uppercase tracking-[0.08em] text-primary md:text-6xl">
              Mowing, treatments, bundles, and subscriptions
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              Every option is priced for real Lubbock yards and designed to feel
              easy to say yes to.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/services">
              Explore all services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {teaserServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <Card className="h-full bg-white/90">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <Badge variant={index === 2 ? "secondary" : "default"}>
                      {service.badge ?? service.category}
                    </Badge>
                    <Sparkles className="h-5 w-5 text-primary/70" />
                  </div>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-end gap-2">
                    <span className="font-display text-5xl uppercase tracking-[0.06em] text-primary">
                      {formatCurrency(service.price)}
                    </span>
                    <span className="pb-2 text-sm font-medium text-muted-foreground">
                      {service.intervalLabel ?? "starting price"}
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {service.features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

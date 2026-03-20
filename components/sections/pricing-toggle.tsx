"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { serviceCatalog } from "@/lib/site-data";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

const bundlePlans = serviceCatalog.filter((service) => service.category === "bundle");
const subscriptions = serviceCatalog.filter(
  (service) => service.category === "subscription"
);

export function PricingToggle() {
  const [showSavings, setShowSavings] = useState(true);

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-5 rounded-[32px] border border-white/45 bg-white/80 p-6 shadow-card md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Badge>Bundle discounts + subscriptions</Badge>
          <h2 className="font-display text-4xl uppercase tracking-[0.08em] text-primary">
            Toggle the local saver pricing
          </h2>
          <p className="text-muted-foreground">
            Cancel anytime • Pause anytime • Lubbock locals save more
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-border bg-secondary px-4 py-3">
          <span className="text-sm font-semibold text-secondary-foreground">
            Standard
          </span>
          <Switch checked={showSavings} onCheckedChange={setShowSavings} />
          <span className="text-sm font-semibold text-primary">Local savings</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {bundlePlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
          >
            <Card className="h-full bg-[#143720] text-white">
              <CardHeader>
                <Badge variant="secondary" className="w-fit bg-[#dff7b4] text-primary">
                  Save {formatCurrency((plan.compareAt ?? plan.price) - plan.price)}
                </Badge>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-white/70">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-end gap-3">
                  <span className="font-display text-5xl uppercase tracking-[0.08em] text-[#ecffcf]">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="pb-2 text-sm text-white/55 line-through">
                    {formatCurrency(plan.compareAt ?? plan.price)}
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-white/75">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/book?service=${plan.id}`}>Book this bundle</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {subscriptions.map((plan, index) => {
          const displayPrice = showSavings ? plan.price : plan.compareAt ?? plan.price;
          const savings = (plan.compareAt ?? plan.price) - plan.price;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <Card
                className={
                  plan.id === "monthly-full-care"
                    ? "h-full border-primary bg-white"
                    : "h-full bg-white/88"
                }
              >
                <CardHeader>
                  <Badge className="w-fit">
                    {showSavings ? plan.badge : "Standard rate"}
                  </Badge>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-end gap-3">
                    <span className="font-display text-5xl uppercase tracking-[0.08em] text-primary">
                      {formatCurrency(displayPrice)}
                    </span>
                    <span className="pb-2 text-sm font-medium text-muted-foreground">
                      {plan.intervalLabel}
                    </span>
                  </div>
                  {plan.compareAt ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="line-through">
                        {formatCurrency(plan.compareAt)}
                      </span>{" "}
                      standard. {showSavings ? `Save ${formatCurrency(savings)}.` : ""}
                    </p>
                  ) : null}
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                  <Button asChild className="w-full">
                    <Link href={`/book?service=${plan.id}`}>Start this plan</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

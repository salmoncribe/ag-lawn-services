import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { addonCatalog, serviceCatalog } from "@/lib/site-data";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Services",
  description:
    "View Lubbock Lawn Pros mowing packages, fertilization, weed control, aeration, and great-deal add-ons."
};

export default function ServicesPage() {
  const mowing = serviceCatalog.filter((service) => service.category === "mowing");
  const treatments = serviceCatalog.filter(
    (service) => service.category === "treatment"
  );

  return (
    <>
      <PageHero
        eyebrow="Lubbock lawn care services"
        title="Professional mowing and treatment pricing, clearly laid out"
        description="Everything customers need to make a fast decision: base prices, what’s included, and the small add-ons that make the service feel like a steal."
      />
      <section className="py-16">
        <div className="container space-y-12">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge>Instant mowing</Badge>
                <h2 className="mt-3 font-display text-5xl uppercase tracking-[0.08em] text-primary">
                  Fast curb appeal
                </h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/book?service=premium-mow">
                  Book mowing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {mowing.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <Badge>{service.badge ?? "Lubbock favorite"}</Badge>
                      {service.compareAt ? (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(service.compareAt)}
                        </span>
                      ) : null}
                    </div>
                    <CardTitle>{service.name}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="font-display text-6xl uppercase tracking-[0.08em] text-primary">
                      {formatCurrency(service.price)}
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {service.features.map((feature) => (
                        <li key={feature}>• {feature}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge>Lawn treatments</Badge>
                <h2 className="mt-3 font-display text-5xl uppercase tracking-[0.08em] text-primary">
                  Healthy lawns, not guesswork
                </h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/book?service=fertilize">
                  Book treatment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {treatments.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <Badge>{service.shortName}</Badge>
                    <CardTitle>{service.name}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="font-display text-5xl uppercase tracking-[0.08em] text-primary">
                      {formatCurrency(service.price)}
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {service.features.map((feature) => (
                        <li key={feature}>• {feature}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Badge>Feels like a steal</Badge>
              <h2 className="mt-3 font-display text-5xl uppercase tracking-[0.08em] text-primary">
                Great-deal add-ons
              </h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {addonCatalog.map((addon) => (
                <Card key={addon.id} className="bg-[#143720] text-white">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit bg-[#dff7b4] text-primary">
                      Great deal!
                    </Badge>
                    <CardTitle>{addon.name}</CardTitle>
                    <CardDescription className="text-white/70">
                      {addon.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="font-display text-5xl uppercase tracking-[0.08em] text-[#ecffcf]">
                      +{formatCurrency(addon.price)}
                    </div>
                    <p className="text-sm text-white/70">
                      Bundle it during booking for the fastest curb-appeal upgrade.
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

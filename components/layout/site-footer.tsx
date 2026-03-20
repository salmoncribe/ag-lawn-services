import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { serviceAreas } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/25 bg-[#102f1d] text-white">
      <div className="container grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Badge variant="secondary" className="bg-white/15 text-white">
            Lubbock service area map
          </Badge>
          <div className="space-y-3">
            <h2 className="font-display text-5xl uppercase tracking-[0.08em]">
              Local lawns. Big-league polish.
            </h2>
            <p className="max-w-2xl text-white/75">
              Billy and Josh built Lubbock Lawn Pros to deliver the look of a
              premium landscape company with the speed and pricing of a local crew.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {serviceAreas.map((area) => (
              <Badge
                key={area}
                variant="secondary"
                className="border-white/10 bg-white/10 text-white"
              >
                {area}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href="/book">Book a Visit</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/pricing">View Plans</Link>
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-white/15 bg-white/10 shadow-card">
          <iframe
            title="Lubbock Lawn Pros service area map"
            src="https://www.google.com/maps?q=Lubbock,Texas&output=embed"
            className="h-[360px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
      <div className="border-t border-white/10 py-5">
        <div className="container flex flex-col gap-2 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Lubbock Lawn Pros. Built for fast local booking.</p>
          <p>Serving Lubbock, Texas with same-day mowing and expert treatments.</p>
        </div>
      </div>
    </footer>
  );
}

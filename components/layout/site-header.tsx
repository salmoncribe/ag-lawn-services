"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Leaf, Menu, PhoneCall, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SiteHeaderProps = {
  user:
    | {
        name: string;
        username: string;
      }
    | null;
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/book", label: "Book Now" },
  { href: "/dashboard", label: "Dashboard" }
];

export function SiteHeader({ user }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-[#f8f2e8]/85 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-meadow">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-2xl leading-none tracking-[0.08em] text-primary">
              Lubbock Lawn Pros
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Billy & Josh
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-semibold transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-foreground/80"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="rounded-full border border-border bg-white/60 px-4 py-2 text-sm text-muted-foreground">
            <span className="mr-2 inline-flex items-center gap-2 text-foreground">
              <PhoneCall className="h-4 w-4 text-primary" />
              806-555-LAWN
            </span>
            Same-day service in Lubbock
          </div>
          <Button asChild variant={user ? "secondary" : "default"}>
            <Link href={user ? "/dashboard" : "/login"}>
              {user ? `Welcome, ${user.name}` : "Client Login"}
            </Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white/70 lg:hidden"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/35 bg-[#f8f2e8]/95 lg:hidden"
          >
            <div className="container flex flex-col gap-3 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-2xl px-4 py-3 font-semibold transition-colors",
                    pathname === item.href
                      ? "bg-primary text-white"
                      : "bg-white/70 text-foreground"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={user ? "/dashboard" : "/login"}
                className="rounded-2xl bg-secondary px-4 py-3 font-semibold text-secondary-foreground"
                onClick={() => setIsOpen(false)}
              >
                {user ? `Welcome, ${user.name}` : "Client Login"}
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

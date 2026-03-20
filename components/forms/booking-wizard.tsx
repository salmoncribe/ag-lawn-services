"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { addDays, format, isToday, startOfToday } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPinned,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { createCheckoutSessionAction } from "@/lib/actions";
import {
  bookingSchema,
  getDefaultBookingDate,
  type BookingValues
} from "@/lib/schemas";
import {
  addonCatalog,
  bookingTimeSlots,
  serviceCatalog,
  type ServiceId
} from "@/lib/site-data";
import { calculateBookingTotal, getAddonsForService } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency } from "@/lib/utils";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripeClient(key: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }

  return stripePromise;
}

const steps = [
  { id: 0, label: "Service" },
  { id: 1, label: "Date" },
  { id: 2, label: "Address" },
  { id: 3, label: "Review" }
];

type BookingWizardProps = {
  stripePublishableKey: string;
  initialServiceId: ServiceId;
  embedded?: boolean;
};

export function BookingWizard({
  stripePublishableKey,
  initialServiceId,
  embedded = false
}: BookingWizardProps) {
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors }
  } = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: initialServiceId,
      addons: [],
      serviceDate: getDefaultBookingDate(),
      timeSlot: bookingTimeSlots[1],
      address: "",
      city: "Lubbock, TX",
      lawnSizeNote: "Standard city lot, gate access on the left."
    }
  });

  const selectedServiceId = watch("serviceId");
  const selectedAddons = watch("addons");
  const selectedDateValue = watch("serviceDate");
  const selectedDate = selectedDateValue
    ? new Date(`${selectedDateValue}T12:00:00`)
    : undefined;
  const selectedService = serviceCatalog.find(
    (service) => service.id === selectedServiceId
  );
  const availableAddons = useMemo(
    () => getAddonsForService(selectedServiceId),
    [selectedServiceId]
  );
  const total = calculateBookingTotal(selectedServiceId, selectedAddons);

  const validateCurrentStep = async () => {
    if (step === 0) {
      return trigger("serviceId");
    }

    if (step === 1) {
      return trigger(["serviceDate", "timeSlot"]);
    }

    if (step === 2) {
      return trigger(["address", "lawnSizeNote"]);
    }

    return true;
  };

  const onSubmit = async (values: BookingValues) => {
    setSubmitError("");

    startTransition(async () => {
      if (!stripePublishableKey) {
        setSubmitError("Add STRIPE_PUBLISHABLE_KEY before testing checkout.");
        return;
      }

      const response = await createCheckoutSessionAction(values);

      if (response.error || !response.sessionId) {
        setSubmitError(response.error ?? "Unable to start Stripe checkout.");
        return;
      }

      const stripe = await getStripeClient(stripePublishableKey);

      if (!stripe) {
        setSubmitError("Stripe could not be loaded in the browser.");
        return;
      }

      const redirectResult = await stripe.redirectToCheckout({
        sessionId: response.sessionId
      });

      if (redirectResult.error) {
        setSubmitError(redirectResult.error.message ?? "Stripe redirect failed.");
      }
    });
  };

  return (
    <section
      id="booking"
      className={cn(
        "rounded-[36px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,243,234,0.95))] shadow-card",
        embedded ? "p-5 md:p-8" : "p-5 md:p-10"
      )}
    >
      <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-6">
          <div className="space-y-4">
            <Badge>Lightning-fast booking</Badge>
            <h2 className="font-display text-5xl uppercase tracking-[0.08em] text-primary">
              Pick a service, choose a slot, pay secure
            </h2>
            <p className="leading-8 text-muted-foreground">
              Every step updates live so customers instantly see exactly what they
              are getting and what it costs.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {steps.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-[26px] border px-4 py-4 transition-colors",
                  item.id === step
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white/65 text-foreground"
                )}
              >
                <p className="text-xs uppercase tracking-[0.22em] opacity-70">
                  Step {item.id + 1}
                </p>
                <p className="mt-1 font-semibold">{item.label}</p>
              </div>
            ))}
          </div>

          <Card className="bg-[#143720] text-white">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.24em] text-white/55">
                  Live total
                </p>
                <Badge variant="secondary" className="bg-[#dff7b4] text-primary">
                  No sign-in required
                </Badge>
              </div>
              <p className="font-display text-6xl uppercase tracking-[0.06em] text-[#ecffcf]">
                {formatCurrency(total)}
              </p>
              <div className="space-y-2 text-sm text-white/72">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#d5ff9d]" />
                  Stripe Checkout session created fresh on every booking
                </p>
                <p className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#d5ff9d]" />
                  Great-deal add-ons stay visible throughout the flow
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              {step === 0 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-4xl uppercase tracking-[0.08em] text-primary">
                      Choose the service
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      Start with the core visit, then stack the easy upsells.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {serviceCatalog.map((service) => {
                      const isActive = selectedServiceId === service.id;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          className={cn(
                            "rounded-[28px] border p-5 text-left transition-all",
                            isActive
                              ? "border-primary bg-primary text-white shadow-meadow"
                              : "border-border bg-white/80 hover:border-primary/45 hover:bg-white"
                          )}
                          onClick={() =>
                            setValue("serviceId", service.id, {
                              shouldValidate: true
                            })
                          }
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                              <p className="text-xs uppercase tracking-[0.22em] opacity-65">
                                {service.category}
                              </p>
                              <p className="font-semibold text-lg">{service.name}</p>
                            </div>
                            <Badge
                              variant={isActive ? "secondary" : "outline"}
                              className={cn(isActive ? "text-primary" : "")}
                            >
                              {service.badge ?? "Bookable"}
                            </Badge>
                          </div>
                          <div className="mt-5 flex items-end gap-2">
                            <span className="font-display text-5xl uppercase tracking-[0.06em]">
                              {formatCurrency(service.price)}
                            </span>
                            <span className="pb-2 text-sm opacity-70">
                              {service.intervalLabel ?? "one-time"}
                            </span>
                          </div>
                          <p
                            className={cn(
                              "mt-4 text-sm leading-7",
                              isActive ? "text-white/78" : "text-muted-foreground"
                            )}
                          >
                            {service.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {errors.serviceId ? (
                    <p className="text-sm text-red-600">{errors.serviceId.message}</p>
                  ) : null}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg">Add-ons</h4>
                      <Badge variant="secondary">Great deal!</Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {availableAddons.map((addon) => {
                        const checked = selectedAddons.includes(addon.id);

                        return (
                          <label
                            key={addon.id}
                            className={cn(
                              "flex cursor-pointer gap-4 rounded-[28px] border p-5 transition-colors",
                              checked
                                ? "border-primary bg-[#ecf8ef]"
                                : "border-border bg-white/80"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                const nextAddons = value
                                  ? Array.from(new Set([...selectedAddons, addon.id]))
                                  : selectedAddons.filter((item) => item !== addon.id);

                                setValue("addons", nextAddons, {
                                  shouldValidate: true,
                                  shouldDirty: true
                                });
                              }}
                            />
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">{addon.name}</span>
                                <Badge variant="secondary">Great deal!</Badge>
                                <span className="text-sm font-semibold text-primary">
                                  +{formatCurrency(addon.price)}
                                </span>
                              </div>
                              <p className="text-sm leading-7 text-muted-foreground">
                                {addon.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {availableAddons.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No add-ons are available for this service type.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-4xl uppercase tracking-[0.08em] text-primary">
                      Pick the date and time
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      The next 7 days stay open so the flow always feels fresh and fast.
                    </p>
                  </div>
                  <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <Controller
                      control={control}
                      name="serviceDate"
                      render={({ field }) => (
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(`${field.value}T12:00:00`) : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(format(date, "yyyy-MM-dd"));
                            }
                          }}
                          disabled={(date) =>
                            date < startOfToday() || date > addDays(startOfToday(), 6)
                          }
                        />
                      )}
                    />

                    <div className="space-y-4">
                      <div className="rounded-[28px] border border-border bg-white/80 p-5">
                        <div className="flex items-center gap-2 text-primary">
                          <CalendarDays className="h-5 w-5" />
                          <span className="font-semibold">
                            {selectedDate
                              ? format(selectedDate, "EEEE, MMMM d")
                              : "Choose a date"}
                          </span>
                          {selectedDate && isToday(selectedDate) ? (
                            <Badge variant="secondary">Same-day flag</Badge>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                          Same-day availability shows when the selected date is today.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {bookingTimeSlots.map((slot) => {
                          const active = watch("timeSlot") === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              className={cn(
                                "rounded-[24px] border p-4 text-left transition-colors",
                                active
                                  ? "border-primary bg-primary text-white"
                                  : "border-border bg-white/80"
                              )}
                              onClick={() =>
                                setValue("timeSlot", slot, { shouldValidate: true })
                              }
                            >
                              <span className="flex items-center gap-2 font-semibold">
                                <Clock3 className="h-4 w-4" />
                                {slot}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {errors.serviceDate ? (
                        <p className="text-sm text-red-600">
                          {errors.serviceDate.message}
                        </p>
                      ) : null}
                      {errors.timeSlot ? (
                        <p className="text-sm text-red-600">{errors.timeSlot.message}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-4xl uppercase tracking-[0.08em] text-primary">
                      Confirm the service address
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      Lubbock is prefilled so all the typing stays minimal.
                    </p>
                  </div>
                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street address</Label>
                      <div className="relative">
                        <MapPinned className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-primary" />
                        <Input
                          id="address"
                          className="pl-11"
                          placeholder="5407 98th St"
                          {...register("address")}
                        />
                      </div>
                      {errors.address ? (
                        <p className="text-sm text-red-600">{errors.address.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" readOnly {...register("city")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lawnSizeNote">Lawn size or gate note</Label>
                      <Textarea
                        id="lawnSizeNote"
                        placeholder="Quarter-acre lot, double gate on the right..."
                        {...register("lawnSizeNote")}
                      />
                      {errors.lawnSizeNote ? (
                        <p className="text-sm text-red-600">
                          {errors.lawnSizeNote.message}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-4xl uppercase tracking-[0.08em] text-primary">
                      Review and pay
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      Final check before Stripe takes over for secure payment.
                    </p>
                  </div>
                  <Card className="bg-[#143720] text-white">
                    <CardContent className="space-y-4 p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                            Service
                          </p>
                          <p className="mt-1 text-2xl font-semibold">
                            {selectedService?.name}
                          </p>
                        </div>
                        <p className="font-display text-5xl uppercase tracking-[0.06em] text-[#ecffcf]">
                          {formatCurrency(total)}
                        </p>
                      </div>
                      <div className="grid gap-4 rounded-[28px] bg-white/10 p-5 text-sm text-white/78 md:grid-cols-3">
                        <div>
                          <p className="uppercase tracking-[0.2em] text-white/50">When</p>
                          <p className="mt-2 font-semibold">
                            {selectedDate
                              ? format(selectedDate, "EEE, MMM d")
                              : "--"}{" "}
                            at {watch("timeSlot")}
                          </p>
                        </div>
                        <div>
                          <p className="uppercase tracking-[0.2em] text-white/50">Where</p>
                          <p className="mt-2 font-semibold">{watch("address")}, Lubbock, TX</p>
                        </div>
                        <div>
                          <p className="uppercase tracking-[0.2em] text-white/50">Add-ons</p>
                          <p className="mt-2 font-semibold">
                            {selectedAddons.length
                              ? selectedAddons
                                  .map(
                                    (addonId) =>
                                      addonCatalog.find((addon) => addon.id === addonId)?.name
                                  )
                                  .filter(Boolean)
                                  .join(", ")
                              : "No add-ons"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20 bg-secondary/70">
                    <CardContent className="space-y-3 p-6">
                      <p className="font-semibold text-secondary-foreground">
                        No account setup needed. Stripe handles payment and your booking
                        confirmation lands immediately after checkout.
                      </p>
                      <p className="text-sm leading-7 text-muted-foreground">
                        Customers can book, pay, and finish without creating a login.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button
                type="button"
                onClick={async () => {
                  const valid = await validateCurrentStep();

                  if (valid) {
                    setStep((current) => Math.min(steps.length - 1, current + 1));
                  }
                }}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Starting Stripe..." : "Pay Securely with Stripe"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

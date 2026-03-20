"use server";

import { addDays } from "date-fns";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { bookingSchema, type BookingValues } from "@/lib/schemas";
import {
  getAddonsForService,
  getServiceById,
  calculateBookingTotal,
  getNextBillingOffsetDays,
  isSubscriptionService
} from "@/lib/pricing";
import { buildDateFromSlot } from "@/lib/utils";
import { getStripeServer } from "@/lib/stripe";
import { type ServiceId } from "@/lib/site-data";

export async function createCheckoutSessionAction(values: BookingValues) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Log in as Billy or Josh before checkout."
    };
  }

  const parsed = bookingSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter valid booking details."
    };
  }

  const service = getServiceById(parsed.data.serviceId);

  if (!service) {
    return {
      error: "That service is unavailable."
    };
  }

  const applicableAddons = getAddonsForService(parsed.data.serviceId).filter((addon) =>
    parsed.data.addons.includes(addon.id)
  );

  const totalPrice = calculateBookingTotal(
    parsed.data.serviceId,
    parsed.data.addons
  );

  const serviceDate = buildDateFromSlot(
    parsed.data.serviceDate,
    parsed.data.timeSlot
  );

  const booking = await prisma.booking.create({
    data: {
      userId: session.user.id,
      serviceType: parsed.data.serviceId,
      addons: parsed.data.addons,
      date: serviceDate,
      address: `${parsed.data.address}, ${parsed.data.city}`,
      notes: parsed.data.lawnSizeNote,
      status: "PENDING",
      totalPrice
    }
  });

  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  const stripe = getStripeServer();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    billing_address_collection: "auto",
    allow_promotion_codes: false,
    success_url: `${origin}/dashboard?success=true&bookingId=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
    metadata: {
      bookingId: booking.id,
      serviceId: parsed.data.serviceId,
      userId: session.user.id
    },
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: service.name,
            description: service.description
          },
          unit_amount: service.price * 100
        },
        quantity: 1
      },
      ...applicableAddons.map((addon) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: addon.name,
            description: addon.description
          },
          unit_amount: addon.price * 100
        },
        quantity: 1
      }))
    ]
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      stripeSessionId: checkoutSession.id
    }
  });

  return {
    sessionId: checkoutSession.id
  };
}

export async function confirmCheckoutSuccess(
  bookingId: string,
  sessionId: string,
  userId: string
) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId
    }
  });

  if (!booking) {
    return null;
  }

  if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
    return booking;
  }

  const stripe = getStripeServer();
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

  if (checkoutSession.payment_status !== "paid") {
    return booking;
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CONFIRMED",
      stripeSessionId: checkoutSession.id
    }
  });

  if (isSubscriptionService(updatedBooking.serviceType as ServiceId)) {
    const service = getServiceById(updatedBooking.serviceType as ServiceId);

    if (service) {
      await prisma.subscription.upsert({
        where: {
          userId_planName: {
            userId,
            planName: service.name
          }
        },
        update: {
          price: service.price,
          active: true,
          nextBillingDate: addDays(
            new Date(),
            getNextBillingOffsetDays(updatedBooking.serviceType as ServiceId)
          )
        },
        create: {
          userId,
          planName: service.name,
          price: service.price,
          active: true,
          nextBillingDate: addDays(
            new Date(),
            getNextBillingOffsetDays(updatedBooking.serviceType as ServiceId)
          )
        }
      });
    }
  }

  return updatedBooking;
}

export async function toggleSubscriptionAction(subscriptionId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      userId: session.user.id
    }
  });

  if (!subscription) {
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      active: !subscription.active
    }
  });

  revalidatePath("/dashboard");
}

export async function logoutAction() {
  await signOut({
    redirectTo: "/"
  });
}

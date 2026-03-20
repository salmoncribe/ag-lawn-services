import {
  addonCatalog,
  serviceCatalog,
  type AddonId,
  type ServiceId
} from "@/lib/site-data";

export function getServiceById(serviceId: ServiceId) {
  return serviceCatalog.find((service) => service.id === serviceId);
}

export function getAddonById(addonId: AddonId) {
  return addonCatalog.find((addon) => addon.id === addonId);
}

export function getAddonsForService(serviceId: ServiceId) {
  return addonCatalog.filter((addon) => addon.appliesTo.includes(serviceId));
}

export function calculateBookingTotal(
  serviceId: ServiceId,
  selectedAddons: AddonId[]
) {
  const service = getServiceById(serviceId);

  if (!service) {
    return 0;
  }

  const addonTotal = getAddonsForService(serviceId)
    .filter((addon) => selectedAddons.includes(addon.id))
    .reduce((total, addon) => total + addon.price, 0);

  return service.price + addonTotal;
}

export function isSubscriptionService(serviceId: ServiceId) {
  return getServiceById(serviceId)?.category === "subscription";
}

export function getNextBillingOffsetDays(serviceId: ServiceId) {
  if (serviceId === "biweekly-mowing") {
    return 14;
  }

  if (serviceId === "seasonal-pro") {
    return 90;
  }

  return 30;
}

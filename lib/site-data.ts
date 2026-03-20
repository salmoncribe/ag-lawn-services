export const serviceIds = [
  "basic-mow",
  "premium-mow",
  "fertilize",
  "weed-control",
  "aeration",
  "mow-fertilize-bundle",
  "biweekly-mowing",
  "monthly-full-care",
  "seasonal-pro"
] as const;

export const addonIds = [
  "leaf-cleanup",
  "edging-upgrade",
  "sprinkler-check"
] as const;

export type ServiceId = (typeof serviceIds)[number];
export type AddonId = (typeof addonIds)[number];

export type ServiceItem = {
  id: ServiceId;
  name: string;
  shortName: string;
  category: "mowing" | "treatment" | "bundle" | "subscription";
  description: string;
  price: number;
  compareAt?: number;
  badge?: string;
  intervalLabel?: string;
  features: string[];
};

export type AddonItem = {
  id: AddonId;
  name: string;
  price: number;
  description: string;
  appliesTo: ServiceId[];
};

export const serviceCatalog: ServiceItem[] = [
  {
    id: "basic-mow",
    name: "Basic Mow",
    shortName: "Basic Mow",
    category: "mowing",
    description:
      "Fast curb appeal for standard Lubbock lawns up to 1/4 acre.",
    price: 45,
    badge: "Fastest start",
    features: [
      "Sharp cut and trim",
      "Bag or mulch clippings",
      "48-hour rain check support"
    ]
  },
  {
    id: "premium-mow",
    name: "Premium Mow",
    shortName: "Premium Mow",
    category: "mowing",
    description:
      "Our signature mow with edging, blowing, and photo-ready cleanup.",
    price: 60,
    compareAt: 75,
    badge: "Most booked",
    features: [
      "Detailed edging",
      "Driveway and sidewalk blow-off",
      "Picture-perfect finish"
    ]
  },
  {
    id: "fertilize",
    name: "Fertilization Treatment",
    shortName: "Fertilize",
    category: "treatment",
    description:
      "Targeted nutrient application built for West Texas heat and soil.",
    price: 55,
    features: [
      "Slow-release seasonal blend",
      "Treatment notes after every visit",
      "Safe timing around mowing"
    ]
  },
  {
    id: "weed-control",
    name: "Weed Control Treatment",
    shortName: "Weed Control",
    category: "treatment",
    description:
      "Knocks back broadleaf weeds without turning the whole yard into a project.",
    price: 45,
    features: [
      "Spot or broad coverage",
      "Lawn-safe application",
      "Great paired with fertilization"
    ]
  },
  {
    id: "aeration",
    name: "Core Aeration",
    shortName: "Aeration",
    category: "treatment",
    description:
      "Deep core aeration that helps roots breathe and treatments work harder.",
    price: 95,
    features: [
      "High-traffic relief",
      "Ideal before fertilization",
      "Seasonal turbo boost"
    ]
  },
  {
    id: "mow-fertilize-bundle",
    name: "Mow + Fertilize Bundle",
    shortName: "Bundle",
    category: "bundle",
    description:
      "Clean cut plus green-up in one visit window. The best first impression package.",
    price: 90,
    compareAt: 100,
    badge: "Save $10",
    features: [
      "Premium mow included",
      "Fertilization same week",
      "Priority calendar slot"
    ]
  },
  {
    id: "biweekly-mowing",
    name: "Bi-Weekly Mowing",
    shortName: "Bi-Weekly",
    category: "subscription",
    description:
      "Keep the yard locked in every two weeks with the local-saver visit rate.",
    price: 40,
    compareAt: 45,
    badge: "10% off",
    intervalLabel: "/visit",
    features: [
      "Repeat schedule every 14 days",
      "Preferred same-day openings",
      "Pause anytime"
    ]
  },
  {
    id: "monthly-full-care",
    name: "Monthly Full Care",
    shortName: "Monthly Full Care",
    category: "subscription",
    description:
      "Mow plus fertilize every four weeks for yards that need reliable polish.",
    price: 135,
    compareAt: 160,
    badge: "Best value",
    intervalLabel: "/month",
    features: [
      "Premium mow included",
      "Fertilization every 4 weeks",
      "Cancel or pause anytime"
    ]
  },
  {
    id: "seasonal-pro",
    name: "Seasonal Pro Plan",
    shortName: "Seasonal Pro",
    category: "subscription",
    description:
      "Six visits and two treatments across the season for people who want it handled.",
    price: 399,
    compareAt: 460,
    badge: "Save $61",
    intervalLabel: "/season",
    features: [
      "6 mowing visits",
      "2 treatment visits",
      "Priority rescheduling"
    ]
  }
];

export const addonCatalog: AddonItem[] = [
  {
    id: "leaf-cleanup",
    name: "Leaf Cleanup",
    price: 15,
    description: "Bag loose leaves and tidy debris hotspots before we leave.",
    appliesTo: [
      "basic-mow",
      "premium-mow",
      "mow-fertilize-bundle",
      "biweekly-mowing",
      "monthly-full-care",
      "seasonal-pro"
    ]
  },
  {
    id: "edging-upgrade",
    name: "Edging Upgrade",
    price: 10,
    description: "Extra curb definition that makes the whole property feel sharper.",
    appliesTo: [
      "basic-mow",
      "premium-mow",
      "mow-fertilize-bundle",
      "biweekly-mowing",
      "monthly-full-care",
      "seasonal-pro"
    ]
  },
  {
    id: "sprinkler-check",
    name: "Sprinkler Check",
    price: 12,
    description: "Quick zone walkthrough to catch misfires before they become brown spots.",
    appliesTo: ["fertilize", "weed-control", "aeration", "monthly-full-care"]
  }
];

export const trustPoints = [
  "Lubbock's #1 Rated",
  "Same-Day Available",
  "100% Satisfaction Guarantee"
];

export const whyUsItems = [
  {
    title: "Clean-cut equipment",
    body:
      "Commercial mowers, sharpened blades, and clean trailers make the first impression before we even start.",
    image: "/images/equipment-mower.svg"
  },
  {
    title: "Treatments that fit West Texas",
    body:
      "Billy and Josh tailor applications around heat, wind, and the dry Lubbock soil profile.",
    image: "/images/treatment-rig.svg"
  },
  {
    title: "Owner-led service",
    body:
      "No guessing who shows up. The owners are on the route and your yard gets the same care every visit.",
    image: "/images/crew-trailer.svg"
  }
];

export const testimonials = [
  {
    name: "Andrea M.",
    neighborhood: "South Lubbock",
    quote:
      "Billy and Josh made our front yard look like a model home lawn in one visit. Booking took maybe a minute."
  },
  {
    name: "Trevor R.",
    neighborhood: "Tech Terrace",
    quote:
      "The premium mow plus edging is absolutely worth it. My curb line has never looked this crisp."
  },
  {
    name: "Melissa C.",
    neighborhood: "Wolfforth area",
    quote:
      "I booked fertilization and weed control for the same week. The communication felt like a much bigger company."
  }
];

export const bookingTimeSlots = [
  "8:00 AM",
  "10:30 AM",
  "1:00 PM",
  "3:30 PM",
  "5:30 PM"
];

export const serviceAreas = [
  "South Lubbock",
  "Tech Terrace",
  "Wolfforth",
  "Ransom Canyon",
  "Monterey",
  "Lakeridge"
];

export const businessFacts = [
  {
    label: "Same-day openings",
    value: "Daily"
  },
  {
    label: "Owner-led crews",
    value: "Billy & Josh"
  },
  {
    label: "Average booking time",
    value: "60 sec"
  }
];

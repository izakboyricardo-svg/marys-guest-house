window.MGH_CONFIG = {
  currency: {
    default: "XOF",
    updatedOn: "2026-11-17",
    xofPerCurrency: {
      XOF: 1,
      EUR: 655.957,
      USD: 655.957 / 1.0989,
      INR: 655.957 / 102.72,
    },
    indicativeCurrencies: ["EUR", "USD", "INR"],
    deposit: {
      enabled: false,
      percent: 0,
    },
  },
  pricing: {
    standard: { nightlyRate: 35000, rateType: "from", promotionPercent: 0 },
    vip: { nightlyRate: 50000, rateType: "fixed", promotionPercent: 0 },
  },
  rooms: {
    "room-209": { name: "Standard Double Room 209", image: "chambre-lit-rayures-bleues-01.jpg", pricingKey: "standard", capacity: null },
    "room-208": { name: "Standard Double Room 208", image: "chambre-lit-bureau-01.jpg", pricingKey: "standard", capacity: null },
    "room-210": { name: "Standard Double Room 210", image: "chambre-lit-bureau-04.jpg", pricingKey: "standard", capacity: null },
    "room-203": { name: "Standard Double Room 203", image: "restaurant-salade-composee-02.jpg", pricingKey: "standard", capacity: null },
    "room-201": { name: "Standard Double Room 201", image: "restaurant-salade-legumes-02.jpg", pricingKey: "standard", capacity: null },
    "room-202": { name: "Standard Double Room 202", image: "restaurant-salade-avocat-01.jpg", pricingKey: "standard", capacity: null },
    "room-207": { name: "Standard Double Room 207", image: "restaurant-salade-avocat-02.jpg", pricingKey: "standard", capacity: null },
    "room-206": { name: "Standard Double Room 206 - VIP", image: "facade-guest-house-01.jpg", pricingKey: "vip", capacity: null },
    "room-212": { name: "Standard Double Room 212", image: "chambre-lit-raye-02.jpg", pricingKey: "standard", capacity: null },
    "room-205": { name: "Standard Double Room 205", image: "chambre-lit-fauteuil-01.jpg", pricingKey: "standard", capacity: null },
    "room-204": { name: "Standard Double Room 204", image: "chambre-lit-fauteuil-02.jpg", pricingKey: "standard", capacity: null },
    "room-211": { name: "Standard Double Room 211", image: "chambre-lit-bureau-03.jpg", pricingKey: "standard", capacity: null },
  },
};

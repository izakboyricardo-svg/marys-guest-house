(() => {
  const reservationReference = () => {
    const now = new Date();
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("");
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(4);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else bytes.set(Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)));
    return `MGH-${date}-${[...bytes].map((byte) => alphabet[byte % alphabet.length]).join("")}`;
  };

  const readTestimonials = () => {
    const saved = localStorage.getItem("marysGuestHouseTestimonials");
    if (!saved) return [];
    const testimonials = JSON.parse(saved);
    if (!Array.isArray(testimonials)) throw new TypeError("The local testimonials value must be an array.");
    return testimonials;
  };

  window.MGH_DATA = {
    getAvailability(roomId, checkIn, checkOut) {
      if (!window.MGH_CONFIG?.rooms?.[roomId]) throw new RangeError("Unknown room identifier.");
      return {
        roomId,
        checkIn,
        checkOut,
        status: "unverified",
        verified: false,
        message: "Availability is not connected to a booking system.",
      };
    },

    async submitReservation(data) {
      return {
        reference: reservationReference(),
        submitted: false,
        localOnly: true,
        data,
      };
    },

    getTestimonials() {
      return readTestimonials();
    },

    async submitTestimonial(data) {
      try {
        const testimonials = readTestimonials();
        testimonials.push({
          id: window.crypto?.randomUUID?.() || `testimonial-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          ...data,
          moderationStatus: "pending",
          submittedAt: new Date().toISOString(),
        });
        localStorage.setItem("marysGuestHouseTestimonials", JSON.stringify(testimonials));
        return { success: true };
      } catch (error) {
        console.error("Could not save the testimonial in local storage.", error);
        return { success: false, error };
      }
    },
  };
})();

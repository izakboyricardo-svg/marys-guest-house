(() => {
  "use strict";

  const reservationReference = () => {
    const now = new Date();
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("");

    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(4);

    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      bytes.set(
        Array.from({ length: 4 }, () => Math.floor(Math.random() * 256))
      );
    }

    return `MGH-${date}-${[...bytes]
      .map((byte) => alphabet[byte % alphabet.length])
      .join("")}`;
  };

  const readTestimonials = () => {
    const saved = localStorage.getItem("marysGuestHouseTestimonials");
    if (!saved) return [];

    const testimonials = JSON.parse(saved);

    if (!Array.isArray(testimonials)) {
      throw new TypeError("The local testimonials value must be an array.");
    }

    return testimonials;
  };

  window.MGH_DATA = {
    getAvailability(roomId, checkIn, checkOut) {
      if (!window.MGH_CONFIG?.rooms?.[roomId]) {
        throw new RangeError("Unknown room identifier.");
      }

      // La disponibilité réelle sera connectée dans une étape séparée.
      return {
        roomId,
        checkIn,
        checkOut,
        status: "unverified",
        verified: false,
        message: "Availability is not yet verified by the booking system.",
      };
    },

    async submitReservation(data) {
      const client = window.MGH_SUPABASE;

      if (!client) {
        throw new Error("Supabase is not initialized.");
      }

      if (!data || !window.MGH_CONFIG?.rooms?.[data.roomId]) {
        throw new Error("Invalid room selection.");
      }

      if (
        !data.arrivalDate ||
        !data.departureDate ||
        data.departureDate <= data.arrivalDate
      ) {
        throw new Error("Invalid reservation dates.");
      }

      const reference = reservationReference();

      const reservation = {
        reference,
        room_id: data.roomId,
        check_in: data.arrivalDate,
        check_out: data.departureDate,
        adults: Number(data.adults),
        children: Number(data.children),
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        email: (data.email || "").trim(),
        phone: data.phone.trim(),
        country: data.country || null,
        arrival_time: data.estimatedArrivalTime || null,
        notes: data.specialRequests || null,
      };

      const { error } = await client
        .from("reservations")
        .insert(reservation);

      if (error) {
        console.error("Supabase reservation error:", error);
        throw error;
      }

      return {
        reference,
        submitted: true,
        localOnly: false,
        status: "pending",
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
          id:
            window.crypto?.randomUUID?.() ||
            `testimonial-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
          ...data,
          moderationStatus: "pending",
          submittedAt: new Date().toISOString(),
        });

        localStorage.setItem(
          "marysGuestHouseTestimonials",
          JSON.stringify(testimonials)
        );

        return { success: true };
      } catch (error) {
        console.error(
          "Could not save the testimonial in local storage.",
          error
        );

        return { success: false, error };
      }
    },
  };
})();

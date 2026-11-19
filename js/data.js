(() => {
  "use strict";

  const readTestimonials = () => {
    const saved = localStorage.getItem("marysGuestHouseTestimonials");
    if (!saved) return [];

    const testimonials = JSON.parse(saved);

    if (!Array.isArray(testimonials)) {
      throw new TypeError("The local testimonials value must be an array.");
    }

    return testimonials;
  };

  const getClient = () => {
    if (!window.MGH_SUPABASE) {
      throw new Error("Supabase is not initialized.");
    }

    return window.MGH_SUPABASE;
  };

  window.MGH_DATA = {
    async getAvailability(roomId, checkIn, checkOut) {
      if (!window.MGH_CONFIG?.rooms?.[roomId]) {
        throw new RangeError("Unknown room identifier.");
      }

      if (!checkIn || !checkOut || checkOut <= checkIn) {
        return {
          roomId,
          checkIn,
          checkOut,
          status: "unavailable",
          verified: false,
        };
      }

      const { data, error } = await getClient().rpc(
        "get_room_availability",
        {
          p_room_id: roomId,
          p_check_in: checkIn,
          p_check_out: checkOut,
        }
      );

      if (error) {
        console.error("Supabase availability error:", error);
        throw error;
      }

      if (!data || !["available", "occupied", "unavailable"].includes(data.status)) {
        throw new Error("The availability service returned an invalid response.");
      }

      return {
        roomId,
        checkIn,
        checkOut,
        status: data.status,
        verified: true,
        nightlyRateXof:
          data.nightly_rate_xof == null
            ? null
            : Number(data.nightly_rate_xof),
        capacity: data.capacity == null ? null : Number(data.capacity),
      };
    },

    async submitReservation(data) {
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

      const { data: result, error } = await getClient().rpc(
        "create_confirmed_reservation",
        {
          p_room_id: data.roomId,
          p_check_in: data.arrivalDate,
          p_check_out: data.departureDate,
          p_adults: Number(data.adults),
          p_children: Number(data.children),
          p_first_name: data.firstName.trim(),
          p_last_name: data.lastName.trim(),
          p_email: (data.email || "").trim(),
          p_phone: data.phone.trim(),
          p_country: data.country || null,
          p_arrival_time: data.estimatedArrivalTime || null,
          p_notes: data.specialRequests || null,
        }
      );

      if (error) {
        console.error("Supabase reservation error:", error);
        throw error;
      }

      if (
        !result ||
        result.status !== "confirmed" ||
        !result.reference ||
        !Number.isInteger(Number(result.nightly_rate_xof)) ||
        !Number.isInteger(Number(result.total_xof)) ||
        !Number.isInteger(Number(result.nights))
      ) {
        throw new Error("The reservation service returned an invalid confirmation.");
      }

      return {
        reference: result.reference,
        submitted: true,
        localOnly: false,
        status: result.status,
        nightlyRateXof: Number(result.nightly_rate_xof),
        totalXof: Number(result.total_xof),
        nights: Number(result.nights),
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

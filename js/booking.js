
(() => {
  "use strict";

  const config = window.MGH_CONFIG;
  const countries = window.MGH_COUNTRIES || [];
  if (!config) return;

  const isFrench = document.documentElement.lang.toLowerCase().startsWith("fr");
  const locale = isFrench ? "fr-FR" : "en-GB";
  const currencyStorageKey = "mghPreferredCurrency";

  const labels = isFrench
    ? {
        currency: "Devise",
        indicative: `Montant indicatif, facturation en FCFA. Taux de référence : ${config.currency.updatedOn}.`,
        capacityUnknown: "Capacité maximale : 2 personnes.",
        invalidStay: "Vérifiez la chambre et choisissez une arrivée future et un départ postérieur.",
        chooseStay: "Choisissez une chambre et des dates valides pour continuer.",
        loading: "Envoi en cours…",
        submit: "Confirmer la réservation",
        success: "Votre réservation est confirmée. Le paiement sera effectué directement à l’établissement.",
        requestReference: "Référence de réservation",
        room: "Chambre",
        arrival: "Arrivée",
        departure: "Départ",
        nights: "Nombre de nuits",
        nightlyRate: "Prix par nuit",
        total: "Total estimatif",
        guests: "Voyageurs",
        adults: "Adultes",
        children: "Enfants",
        arrivalTime: "Heure d’arrivée estimée",
        firstName: "Prénom",
        lastName: "Nom",
        email: "E-mail",
        phone: "Téléphone",
        country: "Pays / Nationalité",
        requests: "Demandes spéciales",
        required: "Ce champ est obligatoire.",
        invalidEmail: "Saisissez une adresse e-mail valide.",
        invalidPhone: "Saisissez un numéro de téléphone valide.",
        capacityExceeded: "Le nombre de voyageurs dépasse la capacité de cette chambre.",
        unknownCountry: "Choisissez un pays dans la liste.",
        honeypot: "La demande n’a pas pu être traitée.",
        selection: "Choisissez une chambre et vos dates",
        continue: "Mettre à jour le séjour",
        unavailable: "Cette chambre n’est plus disponible pour ces dates. Choisissez d’autres dates ou une autre chambre.",
        availabilityChecking: "Vérification de la disponibilité…",
        availabilityAvailable: "Disponible pour les dates choisies.",
        availabilityOccupied: "Occupée pour les dates choisies.",
        availabilityUnavailable: "Cette chambre n’est pas réservable pour ces dates.",
        availabilityError: "La disponibilité n’a pas pu être vérifiée. Réessayez.",
        paymentAtProperty: "Le paiement sera effectué directement à l’établissement. Aucun paiement en ligne n’est demandé.",
        connectionError: "Impossible de contacter le système de réservation. Vérifiez votre connexion et réessayez.",
        genericError: "Une erreur est survenue. Vérifiez les informations et réessayez.",
      }
    : {
        currency: "Currency",
        indicative: `Indicative amount; billing is in XOF. Reference rates: ${config.currency.updatedOn}.`,
        capacityUnknown: "Maximum room capacity: 2 guests.",
        invalidStay: "Check the room and choose a future check-in date and a later check-out date.",
        chooseStay: "Choose a room and valid dates to continue.",
        loading: "Submitting…",
        submit: "Confirm booking",
        success: "Your booking is confirmed. Payment will be made directly at the property.",
        requestReference: "Booking reference",
        room: "Room",
        arrival: "Check-in",
        departure: "Check-out",
        nights: "Number of nights",
        nightlyRate: "Price per night",
        total: "Estimated total",
        guests: "Guests",
        adults: "Adults",
        children: "Children",
        arrivalTime: "Estimated arrival time",
        firstName: "First name",
        lastName: "Last name",
        email: "Email",
        phone: "Phone",
        country: "Country / Nationality",
        requests: "Special requests",
        required: "This field is required.",
        invalidEmail: "Enter a valid email address.",
        invalidPhone: "Enter a valid phone number.",
        capacityExceeded: "The number of guests exceeds this room’s capacity.",
        unknownCountry: "Choose a country from the list.",
        honeypot: "The request could not be processed.",
        selection: "Choose a room and your dates",
        continue: "Update stay",
        unavailable: "This room is no longer available for these dates. Choose different dates or another room.",
        availabilityChecking: "Checking availability…",
        availabilityAvailable: "Available for the selected dates.",
        availabilityOccupied: "Occupied for the selected dates.",
        availabilityUnavailable: "This room cannot be booked for these dates.",
        availabilityError: "Availability could not be checked. Please try again.",
        paymentAtProperty: "Payment will be made directly at the property. No online payment is required.",
        connectionError: "Could not contact the booking system. Check your connection and try again.",
        genericError: "An error occurred. Check the information and try again.",
      };

  const getSavedCurrency = () => {
    try {
      const saved = localStorage.getItem(currencyStorageKey);
      return Object.hasOwn(config.currency.xofPerCurrency, saved)
        ? saved
        : config.currency.default;
    } catch (error) {
      console.warn("Could not read the preferred currency from local storage.", error);
      return config.currency.default;
    }
  };

  let currency = getSavedCurrency();

  const saveCurrency = (value) => {
    currency = value;

    try {
      localStorage.setItem(currencyStorageKey, value);
    } catch (error) {
      console.warn("Could not save the preferred currency to local storage.", error);
    }

    document.dispatchEvent(
      new CustomEvent("mgh-currency-change", { detail: { currency } })
    );
  };

  const formatMoney = (amountXof) => {
    const xofPerCurrency = config.currency.xofPerCurrency[currency];
    const amount = amountXof / xofPerCurrency;

    if (currency === "XOF") {
      return `${new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(amount)} FCFA`;
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const initializeCurrencyPicker = () => {
    const header = document.querySelector("header");
    const languageLink = header?.querySelector(":scope > a[lang]");

    if (!header || !languageLink || header.querySelector("[data-currency-picker]")) {
      return;
    }

    const wrapper = document.createElement("label");
    wrapper.className = "currency-picker";
    wrapper.dataset.currencyPicker = "";

    const label = document.createElement("span");
    label.textContent = labels.currency;

    const select = document.createElement("select");
    select.setAttribute("aria-label", labels.currency);
    select.dataset.currencySelect = "";

    [
      ["XOF", "FCFA (XOF)"],
      ["EUR", "EUR"],
      ["USD", "USD"],
      ["INR", "INR"],
    ].forEach(([value, text]) => select.add(new Option(text, value)));

    select.value = currency;
    select.addEventListener("change", () => saveCurrency(select.value));

    wrapper.append(label, select);
    languageLink.before(wrapper);
  };

  initializeCurrencyPicker();

  const getNightCount = (arrival, departure) => {
    if (!arrival || !departure) return 0;

    const [ay, am, ad] = arrival.split("-").map(Number);
    const [dy, dm, dd] = departure.split("-").map(Number);

    return (
      Date.UTC(dy, dm - 1, dd) - Date.UTC(ay, am - 1, ad)
    ) / 86400000;
  };

  const validDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;

    const date = new Date(`${value}T00:00:00Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  };

  const todayString = () => {
    const today = new Date();

    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
  };

  const priceFor = (roomId, arrival, departure) => {
    const room = config.rooms[roomId];
    const pricing = room && config.pricing[room.pricingKey];

    if (
      !pricing ||
      !validDate(arrival) ||
      !validDate(departure) ||
      arrival < todayString() ||
      departure <= arrival
    ) {
      return null;
    }

    const nights = getNightCount(arrival, departure);
    if (nights <= 0) return null;

    const subtotal = pricing.nightlyRate * nights;
    const discount = Math.round(
      subtotal * (pricing.promotionPercent || 0) / 100
    );

    return {
      room,
      pricing,
      nights,
      subtotal,
      discount,
      total: subtotal - discount,
    };
  };

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  });

  const formatDate = (date) =>
    dateFormatter.format(new Date(`${date}T00:00:00Z`));

  const tr = (key) => labels[key];

  const availabilityLabels = isFrench
    ? {
        unverified: "Choisissez des dates pour vérifier la disponibilité.",
        checking: "Vérification de la disponibilité…",
        available: "Disponible pour les dates choisies.",
        unavailable: "Non disponible pour les dates choisies.",
        occupied: "Réservée pour ces dates.",
        pending: "Réservation en attente",
        reserved: "Réservation confirmée",
        error: "Disponibilité impossible à vérifier.",
      }
    : {
        unverified: "Choose dates to check availability.",
        checking: "Checking availability…",
        available: "Available for the selected dates.",
        unavailable: "Unavailable for the selected dates.",
        occupied: "Reserved for these dates.",
        pending: "Reservation pending",
        reserved: "Reservation confirmed",
        error: "Availability could not be checked.",
      };

  const amenityLabels = isFrench
    ? {
        wifi: "Wi-Fi",
        hotWater: "Eau chaude",
        airConditioning: "Climatisation",
        television: "Télévision",
      }
    : {
        wifi: "Wi-Fi",
        hotWater: "Hot water",
        airConditioning: "Air conditioning",
        television: "Television",
      };

  const amenityIcons = {
    wifi: '<path d="M2 8.8a15 15 0 0 1 20 0M5.5 12.3a10 10 0 0 1 13 0M9 15.8a5 5 0 0 1 6 0M12 19h.01"/>',
    hotWater: '<path d="M7 3c0 2-2 2-2 4s2 2 2 4m5-8c0 2-2 2-2 4s2 2 2 4m5-8c0 2-2 2-2 4s2 2 2 4M4 14h16v7H4z"/>',
    airConditioning: '<path d="M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07 19.07 4.93"/>',
    television: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m8 2 4 3 4-3m-8 17v3m8-3v3"/>',
  };

  const roomName = (room) => isFrench ? room.nameFr : room.nameEn;
  const roomImagePath = (image) =>
    `${isFrench ? "" : "../"}assets/images/${image}`;

  document.querySelectorAll("[data-room-listing]").forEach((listing) => {
    const query = new URLSearchParams(location.search);
    const arrival = query.get("arrivalDate") || "";
    const departure = query.get("departureDate") || "";

    const hasValidStay =
      validDate(arrival) &&
      validDate(departure) &&
      arrival >= todayString() &&
      departure > arrival;

    const status = document.createElement("p");
    status.className = "room-search-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    status.textContent = hasValidStay
      ? isFrench
        ? `Dates demandées : du ${formatDate(arrival)} au ${formatDate(departure)} (${getNightCount(arrival, departure)} nuit(s)). Consultez la disponibilité vérifiée de chaque chambre ci-dessous.`
        : `Requested dates: ${formatDate(arrival)} to ${formatDate(departure)} (${getNightCount(arrival, departure)} night(s)). See each room’s verified availability below.`
      : tr("chooseStay");

    listing.prepend(status);

    const cardList = listing.querySelector("[data-room-cards]");

    if (cardList) {
      cardList.replaceChildren(
        ...Object.entries(config.rooms).map(([id, room]) => {
          const card = document.createElement("li");
          card.dataset.roomId = id;

          const image = document.createElement("img");
          image.src = roomImagePath(room.image);
          image.width = 900;
          image.height = 600;
          image.alt = isFrench ? room.imageAltFr : room.imageAltEn;
          image.loading = "lazy";
          image.decoding = "async";

          const heading = document.createElement("h3");
          heading.textContent = roomName(room);

          const description = document.createElement("p");
          description.textContent = isFrench
            ? room.descriptionFr
            : room.descriptionEn;

          const amenities = document.createElement("ul");
          amenities.className = "room-amenities";
          amenities.setAttribute(
            "aria-label",
            isFrench ? "Équipements disponibles" : "Available amenities"
          );

          room.amenities.forEach((amenity) => {
            const item = document.createElement("li");

            const icon = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg"
            );

            icon.setAttribute("viewBox", "0 0 24 24");
            icon.setAttribute("aria-hidden", "true");
            icon.setAttribute("focusable", "false");
            icon.innerHTML = amenityIcons[amenity];

            const label = document.createElement("span");
            label.textContent = amenityLabels[amenity];

            item.append(icon, label);
            amenities.append(item);
          });

          const details = document.createElement("a");
          details.className = "room-details-cta";
          details.href = `${isFrench ? "chambre.html" : "room.html"}?room=${encodeURIComponent(id)}${hasValidStay ? `&arrivalDate=${encodeURIComponent(arrival)}&departureDate=${encodeURIComponent(departure)}` : ""}`;
          details.textContent = isFrench ? "Voir les détails" : "View room details";
          details.setAttribute(
            "aria-label",
            isFrench
              ? `Voir les détails de ${roomName(room)}`
              : `View details for ${roomName(room)}`
          );

          const booking = document.createElement("a");
          booking.className = "room-cta";
          booking.href = "#";
          booking.textContent = isFrench
            ? "Réserver cette chambre"
            : "Book This Room";

          card.append(image, heading, description, amenities, details, booking);

          return card;
        })
      );
    }

    listing.querySelectorAll(":scope > ul > li").forEach((card) => {
      const heading = card.querySelector("h3");
      const link = card.querySelector(".room-cta");

      if (!heading || !link) return;

      const roomId = card.dataset.roomId;
      if (!roomId) return;

      const roomDetail = config.rooms[roomId];
      if (!roomDetail) return;

      heading.textContent = roomName(roomDetail);

      const room = config.rooms[roomId];
      const pricing = config.pricing[room.pricingKey];

      let availability = hasValidStay
        ? "checking"
        : card.dataset.availability || "unverified";

      const renderPricing = () => {
        const quote = hasValidStay
          ? priceFor(roomId, arrival, departure)
          : null;

        const info = document.createElement("div");
        info.className = "room-booking-info";
        info.dataset.roomBookingInfo = "";

        const rate = document.createElement("p");
        rate.className = "room-booking-info__rate";
        rate.textContent = `${pricing.rateType === "from" ? isFrench ? "À partir de " : "From " : ""}${formatMoney(pricing.nightlyRate)} / ${isFrench ? "nuit" : "night"}`;
        info.append(rate);

        const estimate = document.createElement("p");
        estimate.className = "room-booking-info__total";
        estimate.textContent = quote
          ? `${isFrench ? "Total estimatif" : "Estimated total"} : ${pricing.rateType === "from" ? isFrench ? "à partir de " : "from " : ""}${formatMoney(quote.total)} (${quote.nights} ${isFrench ? "nuit(s)" : "night(s)"})`
          : isFrench
            ? "Choisissez des dates pour estimer le séjour."
            : "Choose dates to estimate your stay.";

        info.append(estimate);

        const statusText = document.createElement("p");
        statusText.className = "room-booking-info__availability";
        statusText.textContent =
          availabilityLabels[availability] || availabilityLabels.unverified;
        info.append(statusText);

        if (room.capacity) {
          const capacity = document.createElement("p");
          capacity.textContent = `${isFrench ? "Capacité" : "Capacity"} : ${room.capacity}`;
          info.append(capacity);
        } else {
          const capacity = document.createElement("p");
          capacity.textContent = isFrench
            ? "Capacité à confirmer"
            : "Capacity to be confirmed";
          info.append(capacity);
        }

        if (currency !== "XOF") {
          const note = document.createElement("p");
          note.className = "room-booking-info__currency-note";
          note.textContent = tr("indicative");
          info.append(note);
        }

        const oldInfo = card.querySelector("[data-room-booking-info]");

        if (oldInfo) oldInfo.replaceWith(info);
        else (heading.nextElementSibling || heading).after(info);
      };

      renderPricing();
      document.addEventListener("mgh-currency-change", renderPricing);

      const bookingUrl = new URL(
        isFrench ? "reservation.html" : "booking.html",
        location.href
      );

      bookingUrl.searchParams.set("room", roomId);

      if (hasValidStay) {
        bookingUrl.searchParams.set("arrivalDate", arrival);
        bookingUrl.searchParams.set("departureDate", departure);
      }

      link.href = bookingUrl.href;
      link.textContent = isFrench
        ? "Réserver cette chambre"
        : "Book This Room";

      const setLinkAvailability = (state) => {
        const cannotRequest = [
          "checking",
          "error",
          "unavailable",
          "occupied",
          "pending",
          "reserved",
        ].includes(state);

        link.setAttribute("aria-disabled", String(cannotRequest));
        link.classList.toggle("is-disabled", cannotRequest);

        if (cannotRequest) link.setAttribute("tabindex", "-1");
        else link.removeAttribute("tabindex");
      };

      link.addEventListener("click", (event) => {
        if (link.getAttribute("aria-disabled") === "true") {
          event.preventDefault();
        }
      });

      setLinkAvailability(availability);

      if (hasValidStay) {
        window.MGH_DATA.getAvailability(roomId, arrival, departure)
          .then((result) => {
            availability = result.status;
            if (Number.isInteger(result.nightlyRateXof) && result.nightlyRateXof > 0) {
              pricing.nightlyRate = result.nightlyRateXof;
            }
            if (Number.isInteger(result.capacity) && result.capacity > 0) {
              room.capacity = result.capacity;
            }
            renderPricing();
            setLinkAvailability(availability);
          })
          .catch((error) => {
            console.error("Could not check room availability.", error);
            availability = "error";
            renderPricing();
            setLinkAvailability(availability);
          });
      }
    });
  });

  const bookingPage = document.querySelector("[data-reservation-page]");
  if (!bookingPage) return;

  const form = bookingPage.querySelector("[data-reservation-form]");
  const formPanel = bookingPage.querySelector("[data-reservation-form]");
  const selectionPanel = bookingPage.querySelector("[data-stay-selection]");
  const status = bookingPage.querySelector("[data-reservation-status]");
  const roomSelect = bookingPage.querySelector("[name='roomId']");
  const arrivalField = bookingPage.querySelector("[name='arrivalDate']");
  const departureField = bookingPage.querySelector("[name='departureDate']");
  const adultsField = bookingPage.querySelector("[name='adults']");
  const childrenField = bookingPage.querySelector("[name='children']");
  const countryField = bookingPage.querySelector("[name='country']");
  const countryDatalist = bookingPage.querySelector("#country-options");
  const dialCodeField = bookingPage.querySelector("[name='dialCode']");
  const phoneField = bookingPage.querySelector("[name='phone']");
  const consentField = bookingPage.querySelector("[name='consent']");
  const currencySelect = document.querySelector("[data-currency-select]");
  const confirmation = bookingPage.querySelector("[data-reservation-confirmation]");
  const availabilityStatus = bookingPage.querySelector("[data-stay-availability]");
  const submitButton = form.querySelector("[type='submit']");
  let currentAvailability = null;
  let availabilityRequest = 0;

  const fields = {
    room: bookingPage.querySelector("[data-summary-room]"),
    image: bookingPage.querySelector("[data-summary-image]"),
    nights: bookingPage.querySelector("[data-summary-nights]"),
    rate: bookingPage.querySelector("[data-summary-rate]"),
    total: bookingPage.querySelector("[data-summary-total]"),
    capacity: bookingPage.querySelector("[data-summary-capacity]"),
    currencyNote: bookingPage.querySelector("[data-currency-note]"),
  };

  const countryName = (country) => isFrench ? country.fr : country.en;

  countries.forEach((country) => {
    const option = document.createElement("option");
    option.value = `${country.flag} ${countryName(country)}`;
    option.dataset.code = country.code;
    countryDatalist.append(option);
  });

  countries
    .filter((country) => country.callingCode)
    .forEach((country) => {
      const option = new Option(
        `${country.flag} ${country.callingCode} · ${countryName(country)}`,
        country.callingCode
      );

      option.dataset.countryCode = country.code;
      dialCodeField.add(option);
    });

  const findCountry = () => {
    const normalized = countryField.value
      .trim()
      .replace(/^\p{Regional_Indicator}{2}\s*/u, "")
      .toLocaleLowerCase(locale);

    return countries.find(
      (country) =>
        countryName(country).toLocaleLowerCase(locale) === normalized
    );
  };

  const updateCountry = () => {
    const country = findCountry();

    if (!country) {
      countryField.setCustomValidity(
        countryField.value ? tr("unknownCountry") : tr("required")
      );
      dialCodeField.setCustomValidity("");
      return;
    }

    countryField.setCustomValidity("");
    dialCodeField.setCustomValidity("");

    const option = [...dialCodeField.options].find(
      (item) => item.dataset.countryCode === country.code
    );

    if (option) dialCodeField.value = option.value;
    else dialCodeField.setCustomValidity(tr("invalidPhone"));
  };

  countryField.addEventListener("input", updateCountry);
  countryField.addEventListener("change", updateCountry);

  dialCodeField.addEventListener("change", () => {
    const country = countries.find(
      (item) =>
        item.code === dialCodeField.selectedOptions[0]?.dataset.countryCode
    );

    if (country) {
      countryField.value = `${country.flag} ${countryName(country)}`;
    }

    countryField.setCustomValidity("");
  });

  const homeCountry = countries.find((country) => country.code === "TG");

  if (homeCountry) {
    countryField.value = `${homeCountry.flag} ${countryName(homeCountry)}`;
    updateCountry();
  }

  const setStatus = (message, state = "") => {
    status.textContent = message;
    status.dataset.state = state;
  };

  const setAvailabilityStatus = (message, state = "") => {
    availabilityStatus.textContent = message;
    availabilityStatus.dataset.state = state;
  };

  const updateDateMinimums = () => {
    arrivalField.min = todayString();
    departureField.min = arrivalField.value || todayString();

    arrivalField.setCustomValidity(
      arrivalField.value && arrivalField.value < todayString()
        ? tr("invalidStay")
        : ""
    );

    departureField.setCustomValidity(
      departureField.value &&
      arrivalField.value &&
      departureField.value <= arrivalField.value
        ? tr("invalidStay")
        : ""
    );

    updateSummary();
  };

  const updateSummary = () => {
    const quote = priceFor(
      roomSelect.value,
      arrivalField.value,
      departureField.value
    );

    const selected = config.rooms[roomSelect.value];

    fields.room.textContent = selected ? roomName(selected) : "—";
    fields.image.hidden = !selected;

    if (selected) {
      fields.image.src =
        `${isFrench ? "" : "../"}assets/images/${selected.image}`;
      fields.image.alt = isFrench
        ? selected.imageAltFr
        : selected.imageAltEn;
    }

    fields.nights.textContent = quote ? String(quote.nights) : "—";

    fields.rate.textContent = quote
      ? `${formatMoney(quote.pricing.nightlyRate)} / ${isFrench ? "nuit" : "night"}`
      : "—";

    fields.total.textContent = quote
      ? `${quote.pricing.rateType === "from" ? isFrench ? "À partir de " : "From " : ""}${formatMoney(quote.total)}`
      : "—";

    fields.capacity.textContent = selected
      ? selected.capacity
        ? `${isFrench ? "Capacité" : "Capacity"} : ${selected.capacity}`
        : tr("capacityUnknown")
      : "";

    fields.currencyNote.hidden = currency === "XOF";
    fields.currencyNote.textContent = tr("indicative");
  };

  const refreshAvailability = async () => {
    const requestId = ++availabilityRequest;
    currentAvailability = null;

    if (
      !config.rooms[roomSelect.value] ||
      !validDate(arrivalField.value) ||
      !validDate(departureField.value) ||
      arrivalField.value < todayString() ||
      departureField.value <= arrivalField.value
    ) {
      setAvailabilityStatus("");
      submitButton.disabled = true;
      return;
    }

    setAvailabilityStatus(tr("availabilityChecking"), "loading");
    submitButton.disabled = true;

    try {
      const result = await window.MGH_DATA.getAvailability(
        roomSelect.value,
        arrivalField.value,
        departureField.value
      );

      if (requestId !== availabilityRequest) return;

      currentAvailability = result;
      const selected = config.rooms[roomSelect.value];
      const pricing = config.pricing[selected.pricingKey];

      if (Number.isInteger(result.nightlyRateXof) && result.nightlyRateXof > 0) {
        pricing.nightlyRate = result.nightlyRateXof;
      }

      if (Number.isInteger(result.capacity) && result.capacity > 0) {
        selected.capacity = result.capacity;
      }

      const messageKey = {
        available: "availabilityAvailable",
        occupied: "availabilityOccupied",
        unavailable: "availabilityUnavailable",
      }[result.status];

      setAvailabilityStatus(
        messageKey ? tr(messageKey) : tr("availabilityError"),
        result.status === "available" ? "success" : "error"
      );
      updateSummary();
      submitButton.disabled = result.status !== "available";
    } catch (error) {
      if (requestId !== availabilityRequest) return;

      console.error("Could not verify the selected room availability.", error);
      currentAvailability = { status: "error" };
      setAvailabilityStatus(tr("availabilityError"), "error");
      submitButton.disabled = true;
    }
  };

  [arrivalField, departureField, roomSelect].forEach((field) => {
    field.addEventListener("change", updateDateMinimums);
    field.addEventListener("input", updateDateMinimums);
    field.addEventListener("change", refreshAvailability);
  });

  document.addEventListener("mgh-currency-change", (event) => {
    currency = event.detail.currency;

    if (currencySelect) currencySelect.value = currency;

    updateSummary();
  });

  [adultsField, childrenField].forEach((field) =>
    field.addEventListener("input", () => {
      const selected = config.rooms[roomSelect.value];
      const guests =
        Number(adultsField.value || 0) +
        Number(childrenField.value || 0);

      adultsField.setCustomValidity("");

      if (selected?.capacity && guests > selected.capacity) {
        adultsField.setCustomValidity(tr("capacityExceeded"));
      }
    })
  );

  const query = new URLSearchParams(location.search);
  const requestedRoom = query.get("room") || "";
  const requestedArrival = query.get("arrivalDate") || "";
  const requestedDeparture = query.get("departureDate") || "";

  const hasCompleteStay =
    config.rooms[requestedRoom] &&
    validDate(requestedArrival) &&
    validDate(requestedDeparture) &&
    requestedArrival >= todayString() &&
    requestedDeparture > requestedArrival;

  Object.entries(config.rooms).forEach(([id, room]) => {
    roomSelect.add(new Option(roomName(room), id));
  });

  if (hasCompleteStay) {
    roomSelect.value = requestedRoom;
    arrivalField.value = requestedArrival;
    departureField.value = requestedDeparture;
    selectionPanel.hidden = true;
  } else {
    setStatus(tr("invalidStay"), "error");
    selectionPanel.hidden = false;
    formPanel.hidden = true;

    if (config.rooms[requestedRoom]) {
      roomSelect.value = requestedRoom;
    }

    if (validDate(requestedArrival)) {
      selectionPanel.elements.arrivalDate.value = requestedArrival;
    }

    if (validDate(requestedDeparture)) {
      selectionPanel.elements.departureDate.value = requestedDeparture;
    }
  }

  selectionPanel.querySelector("[data-selection-heading]").textContent =
    tr("selection");

  selectionPanel.querySelector("[data-selection-submit]").textContent =
    tr("continue");

  const selectionRoomField =
    selectionPanel.querySelector("[name='selectionRoom']");

  selectionRoomField.innerHTML = roomSelect.innerHTML;

  selectionRoomField.value =
    hasCompleteStay || config.rooms[requestedRoom]
      ? requestedRoom
      : "";

  selectionPanel.addEventListener("submit", (event) => {
    event.preventDefault();

    const selectionRoom = selectionPanel.elements.selectionRoom;
    const selectionArrival = selectionPanel.elements.arrivalDate;
    const selectionDeparture = selectionPanel.elements.departureDate;

    selectionArrival.min = todayString();
    selectionDeparture.min =
      selectionArrival.value || todayString();

    if (
      !config.rooms[selectionRoom.value] ||
      !validDate(selectionArrival.value) ||
      !validDate(selectionDeparture.value) ||
      selectionArrival.value < todayString() ||
      selectionDeparture.value <= selectionArrival.value
    ) {
      setStatus(tr("invalidStay"), "error");
      selectionPanel.reportValidity();
      return;
    }

    roomSelect.value = selectionRoom.value;
    arrivalField.value = selectionArrival.value;
    departureField.value = selectionDeparture.value;

    selectionPanel.hidden = true;
    formPanel.hidden = false;

    setStatus("", "");
    updateDateMinimums();
    refreshAvailability();

    formPanel.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    updateCountry();
    updateDateMinimums();

    const honeypot = form.elements.website;

    if (honeypot.value.trim()) {
      setStatus(tr("honeypot"), "error");
      return;
    }

    if (
      !config.rooms[roomSelect.value] ||
      !validDate(arrivalField.value) ||
      !validDate(departureField.value) ||
      arrivalField.value < todayString() ||
      departureField.value <= arrivalField.value
    ) {
      setStatus(tr("invalidStay"), "error");
      return;
    }

    const guests =
      Number(adultsField.value) + Number(childrenField.value);

    const room = config.rooms[roomSelect.value];

    if (room.capacity && guests > room.capacity) {
      adultsField.setCustomValidity(tr("capacityExceeded"));
      adultsField.reportValidity();
      return;
    }

    adultsField.setCustomValidity("");

    if (!findCountry()) {
      countryField.reportValidity();
      return;
    }

    const firstNameField = form.elements.firstName;
    const lastNameField = form.elements.lastName;

    firstNameField.setCustomValidity(
      firstNameField.value.trim() ? "" : tr("required")
    );

    lastNameField.setCustomValidity(
      lastNameField.value.trim() ? "" : tr("required")
    );

    if (
      !firstNameField.reportValidity() ||
      !lastNameField.reportValidity()
    ) {
      return;
    }

    const phoneDigits = phoneField.value.replace(/\D/g, "");

    if (
      phoneDigits.length < 5 ||
      phoneDigits.length > 15 ||
      !/[1-9]/.test(phoneDigits)
    ) {
      phoneField.setCustomValidity(tr("invalidPhone"));
      phoneField.reportValidity();
      return;
    }

    phoneField.setCustomValidity("");

    const quote = priceFor(
      roomSelect.value,
      arrivalField.value,
      departureField.value
    );

    if (!quote) {
      setStatus(tr("invalidStay"), "error");
      return;
    }

    const data = {
      roomId: roomSelect.value,
      roomName: roomName(room),
      arrivalDate: arrivalField.value,
      departureDate: departureField.value,
      nights: quote.nights,
      adults: Number(adultsField.value),
      children: Number(childrenField.value),
      estimatedArrivalTime: form.elements.arrivalTime.value,
      firstName: form.elements.firstName.value.trim(),
      lastName: form.elements.lastName.value.trim(),
      email: form.elements.email.value.trim(),
      phone: `${dialCodeField.value}${phoneDigits}`,
      country: findCountry().code,
      specialRequests: form.elements.specialRequests.value.trim(),
      currency,
      nightlyRateXof: quote.pricing.nightlyRate,
      totalXof: quote.total,
      displayedTotal: formatMoney(quote.total),
      consent: consentField.checked,
    };

    submitButton.disabled = true;
    submitButton.textContent = tr("loading");
    submitButton.setAttribute("aria-busy", "true");

    setStatus(tr("loading"), "loading");

    try {
      if (
        !window.MGH_DATA ||
        typeof window.MGH_DATA.submitReservation !== "function"
      ) {
        throw new Error("The reservation service is not available.");
      }

      const result = await window.MGH_DATA.submitReservation(data);

      if (!result || !result.submitted || !result.reference) {
        throw new Error("The reservation was not saved.");
      }

      data.nights = result.nights;
      data.nightlyRateXof = result.nightlyRateXof;
      data.totalXof = result.totalXof;
      data.displayedTotal = formatMoney(result.totalXof);

      form.hidden = true;
      confirmation.hidden = false;

      confirmation.querySelector(
        "[data-confirmation-reference]"
      ).textContent = result.reference;

      const summary = confirmation.querySelector(
        "[data-confirmation-summary]"
      );

      const adultLabel = isFrench
        ? data.adults === 1 ? "adulte" : "adultes"
        : data.adults === 1 ? "adult" : "adults";

      const childLabel = isFrench
        ? data.children === 1 ? "enfant" : "enfants"
        : data.children === 1 ? "child" : "children";

      const rows = [
        [tr("room"), data.roomName],
        [tr("arrival"), formatDate(data.arrivalDate)],
        [tr("departure"), formatDate(data.departureDate)],
        [tr("nights"), String(data.nights)],
        [
          tr("guests"),
          `${data.adults} ${adultLabel}${data.children ? `, ${data.children} ${childLabel}` : ""}`,
        ],
        [tr("nightlyRate"), formatMoney(data.nightlyRateXof)],
        [tr("total"), data.displayedTotal],
        [tr("firstName"), data.firstName],
        [tr("lastName"), data.lastName],
        [tr("email"), data.email || "—"],
        [tr("phone"), data.phone],
        [tr("country"), countryName(findCountry())],
        [tr("arrivalTime"), data.estimatedArrivalTime || "—"],
        [tr("requests"), data.specialRequests || "—"],
      ];

      summary.replaceChildren(
        ...rows.map(([label, value]) => {
          const row = document.createElement("div");
          const term = document.createElement("dt");
          const detail = document.createElement("dd");

          term.textContent = label;
          detail.textContent = value;

          row.append(term, detail);

          return row;
        })
      );

      const paymentNote = document.createElement("p");
      paymentNote.textContent = tr("paymentAtProperty");
      summary.after(paymentNote);

      setStatus(
        `${tr("success")} ${tr("requestReference")}: ${result.reference}`,
        "success"
      );

      confirmation.focus();
    } catch (error) {
      console.error("Could not submit the booking request.", error);

      const errorMessage = String(
        error?.message || error || ""
      ).toLowerCase();

      const isConflict =
        error?.code === "23P01" ||
        error?.code === "23505" ||
        errorMessage.includes("exclusion") ||
        errorMessage.includes("duplicate key") ||
        errorMessage.includes("conflict");

      if (isConflict) {
        currentAvailability = { status: "occupied" };
        setAvailabilityStatus(tr("availabilityOccupied"), "error");
        setStatus(tr("unavailable"), "error");
      } else if (error?.code === "23514" && errorMessage.includes("capacity")) {
        setStatus(tr("capacityExceeded"), "error");
      } else if (errorMessage.includes("not active")) {
        currentAvailability = { status: "unavailable" };
        setAvailabilityStatus(tr("availabilityUnavailable"), "error");
        setStatus(tr("unavailable"), "error");
      } else if (
        !navigator.onLine ||
        errorMessage.includes("fetch") ||
        errorMessage.includes("network")
      ) {
        setStatus(tr("connectionError"), "error");
      } else {
        setStatus(tr("genericError"), "error");
      }
    } finally {
      if (confirmation.hidden) {
        submitButton.disabled = currentAvailability?.status !== "available";
        submitButton.textContent = tr("submit");
        submitButton.removeAttribute("aria-busy");
      }
    }
  });

  roomSelect.value = hasCompleteStay ? requestedRoom : "";
  updateDateMinimums();
  if (hasCompleteStay) refreshAvailability();
})();

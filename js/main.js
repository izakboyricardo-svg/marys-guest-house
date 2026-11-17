const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const styleElement = document.createElement("style");
styleElement.textContent = `
  @media (prefers-reduced-motion: no-preference) {
    .mgh-interactive { transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease; }
    .mgh-interactive:hover { transform: translateY(-2px); }
    .mgh-interactive:active { transform: scale(.98); }
    .mgh-loading::after { content: ""; display: inline-block; width: .9em; height: .9em; margin-left: .55em; vertical-align: -.1em; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: mgh-spin 700ms linear infinite; }
    .mgh-reveal { opacity: 0; transform: translateY(12px); transition: opacity 450ms ease, transform 450ms ease; }
    .mgh-reveal.is-visible { opacity: 1; transform: none; }
    .mgh-summary { animation: mgh-enter 220ms ease both; }
    @keyframes mgh-spin { to { transform: rotate(360deg); } }
    @keyframes mgh-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  }
  .mgh-toast { position: fixed; z-index: 1100; right: 1rem; bottom: 1rem; max-width: min(28rem, calc(100vw - 2rem)); padding: .85rem 1rem; border: 1px solid currentColor; border-radius: .5rem; color: #f5f7fa; background: #102a43; box-shadow: 0 8px 24px rgb(0 0 0 / 24%); }
  @media (prefers-reduced-motion: reduce) { .mgh-reveal { opacity: 1 !important; transform: none !important; } }
`;
document.head.append(styleElement);

document.querySelectorAll("header nav[aria-label]").forEach((navigation, index) => {
  const header = navigation.closest("header");
  const logo = header?.querySelector(":scope > a:first-child");
  if (!header || !logo) return;

  const isFrench = document.documentElement.lang.toLowerCase().startsWith("fr");
  const button = document.createElement("button");
  const buttonId = `mobile-nav-toggle-${index}`;
  button.className = "mobile-nav-toggle";
  button.type = "button";
  button.id = buttonId;
  button.setAttribute("aria-label", isFrench ? "Ouvrir le menu" : "Open menu");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", navigation.id || `${buttonId}-links`);
  navigation.id ||= `${buttonId}-links`;
  button.innerHTML = '<span></span><span></span><span></span>';
  logo.after(button);
  header.classList.add("mobile-nav-ready");

  const mobileViewport = window.matchMedia("(max-width: 48rem)");
  let isOpen = false;
  const updateMenuState = () => {
    button.setAttribute("aria-expanded", String(isOpen && mobileViewport.matches));
    button.setAttribute("aria-label", isFrench
      ? isOpen && mobileViewport.matches ? "Fermer le menu" : "Ouvrir le menu"
      : isOpen && mobileViewport.matches ? "Close menu" : "Open menu");
    if (mobileViewport.matches) {
      header.dataset.mobileNavOpen = String(isOpen);
      navigation.setAttribute("aria-hidden", String(!isOpen));
      navigation.inert = !isOpen;
    } else {
      delete header.dataset.mobileNavOpen;
      navigation.removeAttribute("aria-hidden");
      navigation.inert = false;
    }
  };

  button.addEventListener("click", () => {
    isOpen = !isOpen;
    updateMenuState();
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      isOpen = false;
      updateMenuState();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen && mobileViewport.matches) {
      isOpen = false;
      updateMenuState();
      button.focus();
    }
  });
  mobileViewport.addEventListener("change", () => {
    isOpen = false;
    updateMenuState();
  });
  updateMenuState();
});

const getTodayString = () => {
  const today = new Date();
  return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
};

const showToast = (message) => {
  let toast = document.querySelector("[data-mgh-toast]");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "mgh-toast";
    toast.dataset.mghToast = "";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toast.hideTimer);
  toast.hideTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 6000);
};

const setLoading = (form, isLoading, label = "") => {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;

  if (isLoading) {
    button.dataset.originalLabel = button.textContent;
    button.textContent = label || button.textContent;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.classList.add("mgh-loading");
    form.dataset.submitting = "true";
    return;
  }

  button.textContent = button.dataset.originalLabel || button.textContent;
  button.disabled = false;
  button.removeAttribute("aria-busy");
  button.classList.remove("mgh-loading");
  delete form.dataset.submitting;
  delete button.dataset.originalLabel;
};

const setDisclosure = (element, isOpen) => {
  element.getAnimations().forEach((animation) => animation.cancel());
  if (prefersReducedMotion.matches) {
    element.hidden = !isOpen;
    return;
  }

  if (isOpen) {
    element.hidden = false;
    element.animate(
      [{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 200, easing: "ease-out" },
    );
    return;
  }

  const animation = element.animate(
    [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-6px)" }],
    { duration: 160, easing: "ease-in" },
  );
  animation.onfinish = () => {
    element.hidden = true;
  };
};

const getNightCount = (arrival, departure) => {
  if (!arrival || !departure) return 0;
  const [arrivalYear, arrivalMonth, arrivalDay] = arrival.split("-").map(Number);
  const [departureYear, departureMonth, departureDay] = departure.split("-").map(Number);
  return (Date.UTC(departureYear, departureMonth - 1, departureDay) - Date.UTC(arrivalYear, arrivalMonth - 1, arrivalDay)) / 86400000;
};

const accommodationPricing = {
  standard: { nightlyRate: 35000, rateType: "from", capacity: null, promotionPercent: 0 },
  vip: { nightlyRate: 50000, rateType: "fixed", capacity: null, promotionPercent: 0 },
  apartment: { nightlyRate: 40000, rateType: "fixed", capacity: 3, promotionPercent: 0 },
};

const accommodationAvailabilityStates = ["unverified", "available", "unavailable", "occupied", "pending", "reserved"];

const getStayQuote = (pricing, arrival, departure) => {
  const nights = getNightCount(arrival, departure);
  if (!pricing || nights <= 0) return null;

  const subtotal = pricing.nightlyRate * nights;
  const discount = Math.round(subtotal * (pricing.promotionPercent || 0) / 100);
  return { nights, subtotal, discount, total: subtotal - discount };
};

const formatRoomPrice = (amount, isFrench) =>
  `${new Intl.NumberFormat(isFrench ? "fr-FR" : "en-GB").format(amount)} FCFA`;

document.querySelectorAll("[data-room-search-form]").forEach((form) => {
  const arrival = form.querySelector('[name="arrivalDate"]');
  const departure = form.querySelector('[name="departureDate"]');
  if (!arrival || !departure) return;
  const isFrench = form.dataset.language === "fr";

  const updateDateConstraints = () => {
    arrival.min = getTodayString();
    departure.min = arrival.value || getTodayString();
    departure.setCustomValidity(
      departure.value && arrival.value && departure.value <= arrival.value
        ? isFrench
          ? "La date de départ doit être postérieure à la date d’arrivée."
          : "The check-out date must be after the check-in date."
        : "",
    );
  };

  [arrival, departure].forEach((field) => {
    field.addEventListener("input", updateDateConstraints);
    field.addEventListener("change", updateDateConstraints);
  });
  form.addEventListener("submit", updateDateConstraints);
  updateDateConstraints();
});

const isRoomListingPage = /(?:^|\/)(?:chambres|rooms)\.html$/.test(window.location.pathname);
const roomListingSection = isRoomListingPage
  ? document.querySelector("#nos-chambres, #rooms")
  : null;

if (roomListingSection) {
  const isFrench = document.documentElement.lang.toLowerCase().startsWith("fr");
  const query = new URLSearchParams(window.location.search);
  const arrival = query.get("arrivalDate") || "";
  const departure = query.get("departureDate") || "";
  const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  const hasValidStay = isValidDate(arrival)
    && isValidDate(departure)
    && arrival >= getTodayString()
    && departure > arrival;
  const dateFormatter = new Intl.DateTimeFormat(isFrench ? "fr-FR" : "en-GB", {
    dateStyle: "long",
    timeZone: "UTC",
  });
  const formattedArrival = hasValidStay
    ? dateFormatter.format(new Date(`${arrival}T00:00:00Z`))
    : "";
  const formattedDeparture = hasValidStay
    ? dateFormatter.format(new Date(`${departure}T00:00:00Z`))
    : "";
  const nights = hasValidStay ? getNightCount(arrival, departure) : 0;
  const bookingForm = document.querySelector("[data-booking-form]");
  const roomSelect = bookingForm?.querySelector('[name="roomId"]');
  const stayStatus = document.createElement("p");
  stayStatus.className = "room-search-status";
  stayStatus.setAttribute("role", "status");
  stayStatus.setAttribute("aria-live", "polite");
  stayStatus.textContent = hasValidStay
    ? isFrench
      ? `Dates demandées : du ${formattedArrival} au ${formattedDeparture} (${nights} nuit${nights > 1 ? "s" : ""}). Les tarifs affichés sont estimatifs ; la disponibilité doit être confirmée par l’établissement.`
      : `Requested dates: ${formattedArrival} to ${formattedDeparture} (${nights} night${nights > 1 ? "s" : ""}). Rates are estimates; availability must be confirmed by the property.`
    : isFrench
      ? "Choisissez vos dates sur la page d’accueil pour estimer le coût du séjour. La disponibilité doit être confirmée par l’établissement."
      : "Choose your dates on the home page to estimate your stay. Availability must be confirmed by the property.";
  const roomCards = roomListingSection.querySelectorAll(":scope > ul > li");
  const labels = isFrench
    ? {
        standardRate: "À partir de",
        perNight: "nuit",
        vipRate: "nuit",
        nights: "Nuitées",
        subtotal: "Sous-total estimatif",
        discount: "Réduction",
        total: "Total estimatif",
        unverified: "Disponibilité à confirmer par l’établissement",
        available: "Disponible (statut de démonstration, à confirmer)",
        unavailable: "Indisponible",
        occupied: "Déjà occupée",
        pending: "Demande en attente",
        reserved: "Réservée",
        rateUnknown: "Tarif à confirmer",
        selectRoom: "Choisir un hébergement",
        bookingButton: "Réserver cette chambre",
      }
    : {
        standardRate: "From",
        perNight: "night",
        vipRate: "night",
        nights: "Nights",
        subtotal: "Estimated subtotal",
        discount: "Discount",
        total: "Estimated total",
        unverified: "Availability to be confirmed by the property",
        available: "Available (demo status, subject to confirmation)",
        unavailable: "Unavailable",
        occupied: "Already occupied",
        pending: "Request pending",
        reserved: "Reserved",
        rateUnknown: "Rate to be confirmed",
        selectRoom: "Choose an accommodation",
        bookingButton: "Book This Room",
      };
  const roomEntries = [];

  if (roomSelect) {
    roomSelect.replaceChildren(new Option(labels.selectRoom, ""));
  }

  const appendInfo = (container, text, className = "") => {
    const paragraph = document.createElement("p");
    paragraph.className = className;
    paragraph.textContent = text;
    container.append(paragraph);
  };

  const roomList = roomListingSection.querySelector(":scope > ul");
  if (roomList) roomListingSection.insertBefore(stayStatus, roomList);

  roomCards.forEach((card, index) => {
    const heading = card.querySelector("h3");
    const description = heading?.nextElementSibling;
    const bookingLink = card.querySelector(".room-cta");
    if (!heading || !description || !bookingLink) return;
    const roomName = heading.textContent.trim();
    const pricingKey = card.dataset.pricingKey || (/\bVIP\b/i.test(roomName) ? "vip" : "standard");
    const pricing = accommodationPricing[pricingKey];
    const roomNumber = roomName.match(/\b(20[1-9]|21[0-2])\b/)?.[1];
    const roomId = card.dataset.roomId || (roomNumber ? `room-${roomNumber}` : `room-${index + 1}`);
    const availability = accommodationAvailabilityStates.includes(card.dataset.availability)
      ? card.dataset.availability
      : "unverified";
    const cannotRequest = ["unavailable", "occupied", "pending", "reserved"].includes(availability);
    const quote = hasValidStay ? getStayQuote(pricing, arrival, departure) : null;
    const rateText = pricing.rateType === "from"
      ? `${labels.standardRate} ${formatRoomPrice(pricing.nightlyRate, isFrench)} / ${labels.perNight}`
      : `${formatRoomPrice(pricing.nightlyRate, isFrench)} / ${labels.vipRate}`;
    const availabilityText = labels[availability] || labels.unverified;

    let bookingInfo = card.querySelector("[data-room-booking-info]");
    if (!bookingInfo) {
      bookingInfo = document.createElement("div");
      bookingInfo.className = "room-booking-info";
      bookingInfo.dataset.roomBookingInfo = "";
      description.after(bookingInfo);
    }

    bookingInfo.replaceChildren();
    appendInfo(bookingInfo, rateText, "room-booking-info__rate");
    if (pricing.capacity) {
      appendInfo(bookingInfo, `${isFrench ? "Capacité" : "Capacity"} : ${pricing.capacity} ${isFrench ? "personnes" : "guests"}`);
    }
    if (quote) {
      appendInfo(bookingInfo, `${labels.nights} : ${quote.nights}`);
      appendInfo(bookingInfo, `${labels.total} : ${pricing.rateType === "from" ? `${isFrench ? "à partir de " : "from "}` : ""}${formatRoomPrice(quote.total, isFrench)}`, "room-booking-info__total");
    } else {
      appendInfo(bookingInfo, hasValidStay ? labels.rateUnknown : isFrench ? "Choisissez des dates pour calculer le total." : "Choose dates to calculate a total.");
    }
    appendInfo(bookingInfo, availabilityText);

    bookingLink.textContent = labels.bookingButton;
    bookingLink.href = "#reservation-request";
    bookingLink.setAttribute("aria-disabled", String(cannotRequest));
    if (cannotRequest) {
      bookingLink.classList.add("is-disabled");
      bookingLink.setAttribute("tabindex", "-1");
    } else {
      bookingLink.classList.remove("is-disabled");
      bookingLink.removeAttribute("tabindex");
    }

    const room = { id: roomId, name: roomName, pricing, availability, cannotRequest, bookingLink };
    roomEntries.push(room);
    if (roomSelect && !cannotRequest) roomSelect.add(new Option(roomName, roomId));
    bookingLink.addEventListener("click", (event) => {
      event.preventDefault();
      if (cannotRequest || !bookingForm || !roomSelect) return;
      roomSelect.value = roomId;
      if (hasValidStay) {
        bookingForm.elements.arrivalDate.value = arrival;
        bookingForm.elements.departureDate.value = departure;
      }
      bookingForm.elements.guests.value = "1";
      bookingForm.elements.roomId.dispatchEvent(new Event("change", { bubbles: true }));
      bookingForm.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", block: "start" });
      roomSelect.focus({ preventScroll: true });
    });
  });

  if (bookingForm && roomSelect) {
    const arrivalField = bookingForm.elements.arrivalDate;
    const departureField = bookingForm.elements.departureDate;
    const guestField = bookingForm.elements.guests;
    const rateOutput = bookingForm.querySelector("[data-booking-rate]");
    const nightsOutput = bookingForm.querySelector("[data-booking-nights]");
    const subtotalOutput = bookingForm.querySelector("[data-booking-subtotal]");
    const discountOutput = bookingForm.querySelector("[data-booking-discount]");
    const totalOutput = bookingForm.querySelector("[data-booking-total]");
    const summaryOutput = bookingForm.querySelector("[data-booking-summary]");
    const statusOutput = bookingForm.querySelector("[data-booking-status]");
    const formattedMoney = (value) => formatRoomPrice(value, isFrench);

    const updateBookingSummary = () => {
      const selectedRoom = roomEntries.find((room) => room.id === roomSelect.value);
      const isValidStay = isValidDate(arrivalField.value)
        && isValidDate(departureField.value)
        && arrivalField.value >= getTodayString()
        && departureField.value > arrivalField.value;
      const quote = selectedRoom && isValidStay
        ? getStayQuote(selectedRoom.pricing, arrivalField.value, departureField.value)
        : null;
      const nightsText = quote ? String(quote.nights) : "—";
      const rateText = selectedRoom
        ? `${selectedRoom.pricing.rateType === "from" ? `${labels.standardRate} ` : ""}${formattedMoney(selectedRoom.pricing.nightlyRate)} / ${labels.perNight}`
        : "—";

      if (rateOutput) rateOutput.textContent = rateText;
      if (nightsOutput) nightsOutput.textContent = nightsText;
      if (subtotalOutput) subtotalOutput.textContent = quote ? formattedMoney(quote.subtotal) : "—";
      if (discountOutput) discountOutput.textContent = quote
        ? quote.discount > 0 ? formattedMoney(quote.discount) : isFrench ? "Aucune promotion configurée" : "No promotion configured"
        : "—";
      if (totalOutput) totalOutput.textContent = quote
        ? `${selectedRoom.pricing.rateType === "from" ? `${isFrench ? "À partir de " : "From "}` : ""}${formattedMoney(quote.total)}`
        : "—";
      if (summaryOutput) {
        summaryOutput.textContent = selectedRoom && isValidStay
          ? isFrench
            ? `${selectedRoom.name} — du ${dateFormatter.format(new Date(`${arrivalField.value}T00:00:00Z`))} au ${dateFormatter.format(new Date(`${departureField.value}T00:00:00Z`))} — ${quote.nights} nuit${quote.nights > 1 ? "s" : ""}. Total estimatif : ${selectedRoom.pricing.rateType === "from" ? "à partir de " : ""}${formattedMoney(quote.total)}. Disponibilité non vérifiée.`
            : `${selectedRoom.name} — ${dateFormatter.format(new Date(`${arrivalField.value}T00:00:00Z`))} to ${dateFormatter.format(new Date(`${departureField.value}T00:00:00Z`))} — ${quote.nights} night${quote.nights > 1 ? "s" : ""}. Estimated total: ${selectedRoom.pricing.rateType === "from" ? "from " : ""}${formattedMoney(quote.total)}. Availability not verified.`
          : isFrench
            ? "Sélectionnez un hébergement et des dates valides pour afficher le récapitulatif."
            : "Select an accommodation and valid dates to view the summary.";
      }
      if (statusOutput && statusOutput.dataset.state !== "error") statusOutput.textContent = "";
    };

    const updateBookingDateConstraints = () => {
      arrivalField.min = getTodayString();
      departureField.min = arrivalField.value || getTodayString();
      arrivalField.setCustomValidity(
        arrivalField.value && arrivalField.value < getTodayString()
          ? isFrench ? "La date d’arrivée ne peut pas être passée." : "The check-in date cannot be in the past."
          : "",
      );
      departureField.setCustomValidity(
        departureField.value && arrivalField.value && departureField.value <= arrivalField.value
          ? isFrench
            ? "La date de départ doit être postérieure à la date d’arrivée."
            : "The check-out date must be after the check-in date."
          : "",
      );
      updateBookingSummary();
    };

    if (hasValidStay) {
      arrivalField.value = arrival;
      departureField.value = departure;
    }
    [arrivalField, departureField].forEach((field) => {
      field.addEventListener("input", updateBookingDateConstraints);
      field.addEventListener("change", updateBookingDateConstraints);
    });
    [roomSelect, guestField].forEach((field) => {
      field.addEventListener("input", updateBookingSummary);
      field.addEventListener("change", updateBookingSummary);
    });

    const requestedRoom = query.get("room");
    if (requestedRoom && roomEntries.some((room) => room.id === requestedRoom)) {
      roomSelect.value = requestedRoom;
    }
    updateBookingDateConstraints();

    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      updateBookingDateConstraints();
      if (!bookingForm.reportValidity()) return;

      const selectedRoom = roomEntries.find((room) => room.id === roomSelect.value);
      if (!selectedRoom || selectedRoom.cannotRequest) {
        roomSelect.setCustomValidity(isFrench
          ? "Choisissez un hébergement pouvant recevoir une demande."
          : "Choose an accommodation that can accept a request.");
        roomSelect.reportValidity();
        return;
      }
      roomSelect.setCustomValidity("");
      if (statusOutput) {
        statusOutput.dataset.state = "info";
        statusOutput.textContent = isFrench
          ? "Le service de réservation en ligne n’est pas encore connecté. Votre demande n’a pas été envoyée et aucune réservation n’a été confirmée."
          : "The online booking service is not connected yet. Your request has not been sent and no reservation has been confirmed.";
      }
    });
  }
}

document.querySelectorAll("[data-contact-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.dataset.submitting === "true") return;

    if (!form.reportValidity()) {
      return;
    }

    const values = new FormData(form);
    const isFrench = form.dataset.language === "fr";
    const labels = isFrench
      ? {
          title: "Message de contact — Mary’s Guest House",
          name: "Nom complet",
          email: "Adresse e-mail",
          phone: "Téléphone",
          subject: "Sujet",
          message: "Message",
        }
      : {
          title: "Contact message — Mary’s Guest House",
          name: "Full name",
          email: "Email address",
          phone: "Phone",
          subject: "Subject",
          message: "Message",
        };
    const lines = [
      labels.title,
      "",
      `${labels.name}: ${values.get("name")}`,
      `${labels.email}: ${values.get("email")}`,
    ];
    const phone = values.get("phone")?.toString().trim();

    if (phone) {
      lines.push(`${labels.phone}: ${phone}`);
    }

    lines.push(
      `${labels.subject}: ${values.get("subject")}`,
      "",
      `${labels.message}: ${values.get("message")}`,
    );

    const whatsappUrl = new URL("https://wa.me/22893541512");
    whatsappUrl.searchParams.set("text", lines.join("\n"));
    setLoading(form, true, isFrench ? "Ouverture de WhatsApp…" : "Opening WhatsApp…");
    showToast(isFrench ? "Ouverture de votre application de messagerie…" : "Opening your messaging app…");
    window.location.assign(whatsappUrl);
  });
});

const testimonialsStorageKey = "marysGuestHouseTestimonials";
const testimonialSubmissionTimesKey = "marysGuestHouseTestimonialSubmissionTimes";
const demoTestimonials = [
  {
    id: "demo-afi",
    firstName: "Afi",
    rating: 5,
    comment: "Un accueil chaleureux, une chambre confortable et un séjour très reposant. Je reviendrai avec plaisir.",
    commentEn: "A warm welcome, a comfortable room and a very restful stay. I would be delighted to return.",
  },
  {
    id: "demo-kélia",
    firstName: "Kélia",
    rating: 5,
    comment: "Une belle adresse à Lomé. L’équipe est attentionnée et le restaurant propose de très bons plats.",
    commentEn: "A lovely place in Lomé. The team is attentive and the restaurant serves very good food.",
  },
  {
    id: "demo-salim",
    firstName: "Salim",
    rating: 5,
    comment: "Un cadre accueillant et un service soigné. J’ai beaucoup apprécié le confort de la chambre.",
    commentEn: "A welcoming setting and attentive service. I really appreciated the comfort of the room.",
  },
];

const readTestimonials = () => {
  try {
    const savedTestimonials = localStorage.getItem(testimonialsStorageKey);
    const testimonials = savedTestimonials ? JSON.parse(savedTestimonials) : [];
    return Array.isArray(testimonials) ? testimonials : [];
  } catch {
    return [];
  }
};

const saveTestimonials = (testimonials) => {
  try {
    localStorage.setItem(testimonialsStorageKey, JSON.stringify(testimonials));
    return true;
  } catch {
    return false;
  }
};

const formatStayDate = (date) => {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? ""
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(parsedDate);
};

const publicTestimonialsList = document.querySelector("[data-testimonials-list]");

if (publicTestimonialsList) {
  const isEnglish = document.documentElement.lang === "en";
  const publishedTestimonials = readTestimonials().filter(
    (testimonial) => testimonial.moderationStatus === "published" || testimonial.published === true,
  );

  [...demoTestimonials, ...publishedTestimonials].forEach((testimonial) => {
    const card = document.createElement("article");
    card.className = "testimonial-card";

    const rating = document.createElement("p");
    const ratingValue = Math.min(5, Math.max(1, Number(testimonial.rating) || 1));
    rating.className = "testimonial-card__rating";
    rating.setAttribute("role", "img");
    rating.setAttribute(
      "aria-label",
      isEnglish ? `Rating: ${ratingValue} out of 5` : `Note : ${ratingValue} sur 5`,
    );
    rating.textContent = `${"★".repeat(ratingValue)}${"☆".repeat(5 - ratingValue)}`;

    const quote = document.createElement("blockquote");
    quote.textContent = isEnglish && testimonial.commentEn
      ? testimonial.commentEn
      : testimonial.comment || "";

    const author = document.createElement("p");
    author.className = "testimonial-card__author";
    author.textContent = testimonial.firstName || (isEnglish ? "Guest" : "Client");

    card.append(rating, quote, author);

    publicTestimonialsList.append(card);
  });

  const openButton = document.querySelector("[data-open-testimonial]");
  const panel = document.querySelector("[data-testimonial-panel]");
  const form = document.querySelector("[data-public-testimonial-form]");
  const status = document.querySelector("[data-testimonial-submit-status]");
  const firstNameField = form.elements.namedItem("firstName");
  const commentField = form.elements.namedItem("comment");

  form.addEventListener("invalid", (event) => {
    if (form.dataset.invalidMessageSet === "true") return;
    form.dataset.invalidMessageSet = "true";
    status.dataset.state = "error";
    status.textContent = event.target.validity.customError
      ? event.target.validationMessage
      : event.target.validity.valueMissing
        ? isEnglish ? "This field is required." : "Ce champ est obligatoire."
        : isEnglish
          ? "Please check the field formats before submitting."
          : "Vérifiez le format des champs avant l’envoi.";
    queueMicrotask(() => delete form.dataset.invalidMessageSet);
  }, true);

  form.addEventListener("input", (event) => {
    if (event.target === firstNameField) {
      firstNameField.setCustomValidity(
        firstNameField.value.trim() ? "" : isEnglish ? "Please enter your first name." : "Indiquez votre prénom.",
      );
    }
    if (event.target === commentField) {
      commentField.setCustomValidity(
        commentField.value.trim().length >= 15
          ? ""
          : isEnglish
            ? "Your comment must be at least 15 characters long."
            : "Votre commentaire doit contenir au moins 15 caractères.",
      );
    }
    const formIsValid = [...form.elements].every((field) => !field.willValidate || field.validity.valid);
    if (status.dataset.state === "error" && formIsValid) {
      status.textContent = "";
      delete status.dataset.state;
    }
  });

  openButton.addEventListener("click", () => {
    const isOpening = openButton.getAttribute("aria-expanded") !== "true";
    setDisclosure(panel, isOpening);
    openButton.setAttribute("aria-expanded", String(isOpening));
    if (isOpening) {
      form.elements.firstName.focus();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.dataset.submitting === "true") return;
    if (!form.reportValidity()) {
      return;
    }

    const values = new FormData(form);
    const firstName = values.get("firstName").toString().trim();
    const comment = values.get("comment").toString().trim();
    firstNameField.setCustomValidity(
      firstName ? "" : isEnglish ? "Please enter your first name." : "Indiquez votre prénom.",
    );
    commentField.setCustomValidity(
      comment.length >= 15
        ? ""
        : isEnglish
          ? "Your comment must be at least 15 characters long."
          : "Votre commentaire doit contenir au moins 15 caractères.",
    );
    if (!form.reportValidity()) return;

    if (values.get("website").toString().trim()) {
      status.textContent = isEnglish
        ? "Your testimonial could not be submitted."
        : "Votre témoignage n’a pas pu être envoyé.";
      return;
    }

    if (!firstName || comment.length < 15) {
      status.textContent = isEnglish
        ? "Please enter a first name and a comment of at least 15 characters."
        : "Indiquez un prénom et un commentaire d’au moins 15 caractères.";
      return;
    }

    let submissionTimes = [];
    try {
      submissionTimes = JSON.parse(localStorage.getItem(testimonialSubmissionTimesKey) || "[]");
      if (!Array.isArray(submissionTimes)) {
        submissionTimes = [];
      }
    } catch {
      submissionTimes = [];
    }

    const now = Date.now();
    const recentSubmissions = submissionTimes.filter((time) => now - time < 60 * 60 * 1000);
    if (recentSubmissions.length >= 2 || (recentSubmissions.length > 0 && now - recentSubmissions.at(-1) < 30_000)) {
      status.dataset.state = "error";
      status.textContent = isEnglish
        ? "Please wait before submitting another testimonial."
        : "Merci de patienter avant d’envoyer un autre témoignage.";
      showToast(status.textContent);
      return;
    }

    setLoading(form, true, isEnglish ? "Sending…" : "Envoi…");
    const testimonials = readTestimonials();
    testimonials.push({
      id: crypto.randomUUID(),
      firstName,
      rating: Number(values.get("rating")),
      comment,
      moderationStatus: "pending",
      submittedAt: new Date().toISOString(),
    });

    if (!saveTestimonials(testimonials)) {
      setLoading(form, false);
      status.dataset.state = "error";
      status.textContent = isEnglish
        ? "Saving failed in this browser. Please try again later."
        : "L’enregistrement a échoué dans ce navigateur. Réessayez plus tard.";
      showToast(status.textContent);
      return;
    }

    try {
      localStorage.setItem(testimonialSubmissionTimesKey, JSON.stringify([...recentSubmissions, now]));
    } catch {
      status.dataset.state = "error";
      status.textContent = isEnglish
        ? "Your testimonial was saved, but the submission limit could not be updated."
        : "Le témoignage a été enregistré, mais la limite d’envoi n’a pas pu être mise à jour.";
    }
    setLoading(form, false);
    form.reset();
    setDisclosure(panel, false);
    openButton.setAttribute("aria-expanded", "false");
    status.dataset.state = "success";
    status.textContent = isEnglish
      ? "Thank you. Your testimonial has been saved and is awaiting approval."
      : "Merci. Votre témoignage est enregistré et attend sa validation.";
    showToast(status.textContent);
  });
}

const testimonialsAdmin = document.querySelector("[data-testimonials-admin]");

if (testimonialsAdmin) {
  const list = testimonialsAdmin.querySelector("[data-admin-testimonials-list]");
  const status = testimonialsAdmin.querySelector("[data-admin-status]");

  const announce = (message) => {
    status.textContent = message;
    showToast(message);
  };

  const renderAdminTestimonials = () => {
    const testimonials = readTestimonials();
    list.replaceChildren();
    testimonialsAdmin.querySelector("[data-admin-empty]").hidden = testimonials.length > 0;

    testimonials.forEach((testimonial) => {
      const item = document.createElement("li");
      item.className = "testimonial-admin-card";

      const details = document.createElement("div");
      details.className = "testimonial-admin-card__details";
      const title = document.createElement("h3");
      title.textContent = testimonial.firstName || "Sans prénom";
      const comment = document.createElement("p");
      comment.textContent = testimonial.comment || "";
      const meta = document.createElement("p");
      const ratingValue = Math.min(5, Math.max(1, Number(testimonial.rating) || 1));
      const moderationStatus = testimonial.moderationStatus || (testimonial.published ? "published" : "pending");
      const statusLabel = moderationStatus === "published" ? "Publié" : moderationStatus === "hidden" ? "Masqué" : "En attente de validation";
      meta.textContent = `${ratingValue}/5 · ${statusLabel}`;
      details.append(title, comment, meta);

      const actions = document.createElement("div");
      actions.className = "testimonial-admin-card__actions";
      [
        { action: "toggle", label: moderationStatus === "published" ? "Masquer" : "Valider et publier" },
        { action: "delete", label: "Supprimer" },
      ].forEach(({ action, label }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.testimonialAction = action;
        button.dataset.testimonialId = testimonial.id;
        button.textContent = label;
        if (action === "delete") {
          button.className = "button--danger";
        }
        actions.append(button);
      });

      item.append(details, actions);
      list.append(item);
    });
  };

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-testimonial-action]");
    if (!button) {
      return;
    }

    const testimonials = readTestimonials();
    const testimonial = testimonials.find((item) => item.id === button.dataset.testimonialId);
    if (!testimonial) {
      return;
    }

    if (button.dataset.testimonialAction === "delete") {
      if (!window.confirm(`Supprimer le témoignage de ${testimonial.firstName || "ce client"} ?`)) {
        return;
      }

      const updatedTestimonials = testimonials.filter((item) => item.id !== testimonial.id);
      if (!saveTestimonials(updatedTestimonials)) {
        announce("Impossible de supprimer ce témoignage dans ce navigateur.");
        return;
      }
      announce("Témoignage supprimé.");
      renderAdminTestimonials();
      return;
    }

    testimonial.moderationStatus = testimonial.moderationStatus === "published" || testimonial.published
      ? "hidden"
      : "published";
    delete testimonial.published;
    if (!saveTestimonials(testimonials)) {
      announce("Impossible de modifier la publication dans ce navigateur.");
      return;
    }
    announce(testimonial.moderationStatus === "published" ? "Témoignage validé et publié sur l’accueil." : "Témoignage masqué.");
    renderAdminTestimonials();
  });

  renderAdminTestimonials();
}

const interactiveElements = document.querySelectorAll(
  "button, .room-cta, .hero__actions a, .whatsapp-float",
);
interactiveElements.forEach((element) => element.classList.add("mgh-interactive"));

const revealElements = new Set(
  document.querySelectorAll("main > section:not(.hero), main > section > ul > li, .about-section, .testimonial-card, [data-testimonial-panel]"),
);
const currentPage = window.location.pathname.split("/").pop();
const roomSection = currentPage === "chambres.html"
  ? document.querySelector("#nos-chambres")
  : currentPage === "rooms.html"
    ? document.querySelector("#rooms")
    : null;
if (roomSection) revealElements.delete(roomSection);
revealElements.forEach((element) => element.classList.add("mgh-reveal"));

if (prefersReducedMotion.matches) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}
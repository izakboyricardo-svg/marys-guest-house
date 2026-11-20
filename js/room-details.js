(() => {
  const config = window.MGH_CONFIG;
  const page = document.querySelector("[data-room-details]");
  if (!config || !page) return;

  const isFrench = document.documentElement.lang.toLowerCase().startsWith("fr");
  const locale = isFrench ? "fr-FR" : "en-GB";
  const query = new URLSearchParams(location.search);
  const roomId = query.get("room");
  const room = config.rooms[roomId];
  const labels = isFrench
    ? {
        missing: "Cette chambre n’a pas été trouvée.",
        rooms: "Voir toutes les chambres",
        capacity: "Capacité",
        capacityUnknown: "À confirmer auprès de l’établissement",
        nightly: "nuit",
        availabilityChecking: "Vérification de la disponibilité…",
        availabilityAvailable: "Disponible pour les dates choisies.",
        availabilityOccupied: "Occupée pour les dates choisies.",
        availabilityUnavailable: "Cette chambre n’est pas disponible pour ces dates.",
        availabilityError: "La disponibilité n’a pas pu être vérifiée. Réessayez.",
        from: "À partir de",
        amenities: "Équipements et services",
        gallery: "Photos des espaces d’hébergement",
        galleryNote: "Les photos disponibles ne sont pas toutes identifiées chambre par chambre.",
        occupiedTitle: "Périodes déjà réservées",
        occupiedEmpty: "Aucune réservation prévue pour le moment.",
        occupiedLoading: "Chargement des périodes réservées…",
        occupiedError: "Les périodes réservées ne peuvent pas être chargées pour le moment.",
        occupiedRange: (checkIn, checkOut) => `Occupée du ${checkIn} au ${checkOut}.`,
        arrival: "Date d’arrivée",
        departure: "Date de départ",
        reserve: "Réserver cette chambre",
        close: "Fermer la photo",
        previous: "Photo précédente",
        next: "Photo suivante",
        photo: "Photo",
        invalidDates: "La date de départ doit être postérieure à la date d’arrivée.",
      }
    : {
        missing: "This room could not be found.",
        rooms: "View all rooms",
        capacity: "Capacity",
        capacityUnknown: "Please confirm with the property",
        nightly: "night",
        availabilityChecking: "Checking availability…",
        availabilityAvailable: "Available for the selected dates.",
        availabilityOccupied: "Occupied for the selected dates.",
        availabilityUnavailable: "This room is unavailable for those dates.",
        availabilityError: "Availability could not be checked. Please try again.",
        from: "From",
        amenities: "Amenities and services",
        gallery: "Guest accommodation photos",
        galleryNote: "The available photos are not all identified room by room.",
        occupiedTitle: "Already booked dates",
        occupiedEmpty: "No bookings scheduled at the moment.",
        occupiedLoading: "Loading booked dates…",
        occupiedError: "Booked dates could not be loaded right now.",
        occupiedRange: (checkIn, checkOut) => `Occupied from ${checkIn} to ${checkOut}.`,
        arrival: "Check-in date",
        departure: "Check-out date",
        reserve: "Book This Room",
        close: "Close photo",
        previous: "Previous photo",
        next: "Next photo",
        photo: "Photo",
        invalidDates: "Check-out must be later than check-in.",
      };
  const text = (selector, value) => {
    const element = page.querySelector(selector);
    if (element) element.textContent = value;
  };
  const roomsPath = isFrench ? "chambres.html" : "rooms.html";
  if (!room) {
    text("[data-room-error]", labels.missing);
    page.querySelector(".room-detail-layout").hidden = true;
    const link = page.querySelector("[data-rooms-link]");
    if (link) {
      link.href = roomsPath;
      link.textContent = labels.rooms;
    }
    return;
  }

  const name = isFrench ? room.nameFr : room.nameEn;
  document.title = `${name} | Mary’s Guest House`;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) {
    descriptionMeta.content = isFrench
      ? `Découvrez ${name} : description, équipements et tarif à Mary’s Guest House.`
      : `Explore ${name}, its amenities and nightly rate at Mary’s Guest House.`;
  }
  const openGraphTitle = document.querySelector('meta[property="og:title"]');
  if (openGraphTitle) openGraphTitle.content = document.title;
  const openGraphDescription = document.querySelector('meta[property="og:description"]');
  if (openGraphDescription && descriptionMeta) openGraphDescription.content = descriptionMeta.content;
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.content = document.title;
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescription && descriptionMeta) twitterDescription.content = descriptionMeta.content;
  const imageBase = isFrench ? "assets/images/" : "../assets/images/";
  const openGraphImage = document.querySelector('meta[property="og:image"]');
  if (openGraphImage) openGraphImage.content = new URL(`${imageBase}${room.image}`, location.href).href;
  const openGraphImageAlt = document.querySelector('meta[property="og:image:alt"]');
  if (openGraphImageAlt) openGraphImageAlt.content = isFrench ? room.imageAltFr : room.imageAltEn;
  const xofRate = config.currency.xofPerCurrency;
  const currencyKey = "mghPreferredCurrency";
  let currency = config.currency.default;
  try {
    const saved = localStorage.getItem(currencyKey);
    if (Object.hasOwn(xofRate, saved)) currency = saved;
  } catch (error) {
    console.warn("Could not read the preferred currency from local storage.", error);
  }
  const formatMoney = (value) => {
    const amount = value / xofRate[currency];
    return currency === "XOF"
      ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)} FCFA`
      : new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  };
  const pricing = config.pricing[room.pricingKey];

  text("[data-room-title]", name);
  text("[data-room-description]", isFrench ? room.descriptionFr : room.descriptionEn);
  text("[data-room-capacity-label]", labels.capacity);
  text("[data-room-capacity]", room.capacity ? String(room.capacity) : labels.capacityUnknown);
  const occupiedDateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const occupiedSection = document.createElement("section");
  occupiedSection.className = "room-occupied-periods";
  occupiedSection.setAttribute("aria-labelledby", "room-occupied-heading");
  const occupiedHeading = document.createElement("h2");
  occupiedHeading.id = "room-occupied-heading";
  occupiedHeading.textContent = labels.occupiedTitle;
  const occupiedContent = document.createElement("div");
  occupiedContent.setAttribute("role", "status");
  occupiedContent.setAttribute("aria-live", "polite");
  occupiedContent.textContent = labels.occupiedLoading;
  occupiedSection.append(occupiedHeading, occupiedContent);
  const renderRate = () => {
    text("[data-room-rate]", `${pricing.rateType === "from" ? `${labels.from} ` : ""}${formatMoney(pricing.nightlyRate)} / ${labels.nightly}`);
    const note = page.querySelector("[data-room-currency-note]");
    if (note) {
      note.hidden = currency === "XOF";
      note.textContent = isFrench
        ? `Montant indicatif, facturation en FCFA. Taux de référence : ${config.currency.updatedOn}.`
        : `Indicative amount; billing is in XOF. Reference rates: ${config.currency.updatedOn}.`;
    }
  };
  renderRate();
  document.addEventListener("mgh-currency-change", (event) => {
    currency = event.detail.currency;
    renderRate();
  });
  const mainImage = page.querySelector("[data-room-main-image]");
  mainImage.src = `${imageBase}${room.image}`;
  mainImage.alt = isFrench ? room.imageAltFr : room.imageAltEn;
  text("[data-room-amenities-title]", labels.amenities);
  text("[data-room-gallery-title]", labels.gallery);
  text("[data-room-gallery-note]", labels.galleryNote);

  const equipmentLabels = isFrench
    ? { wifi: "Wi-Fi", hotWater: "Eau chaude", airConditioning: "Climatisation", television: "Télévision" }
    : { wifi: "Wi-Fi", hotWater: "Hot water", airConditioning: "Air conditioning", television: "Television" };
  const equipmentIcons = {
    wifi: '<path d="M2 8.8a15 15 0 0 1 20 0M5.5 12.3a10 10 0 0 1 13 0M9 15.8a5 5 0 0 1 6 0M12 19h.01"/>',
    hotWater: '<path d="M7 3c0 2-2 2-2 4s2 2 2 4m5-8c0 2-2 2-2 4s2 2 2 4m5-8c0 2-2 2-2 4s2 2 2 4M4 14h16v7H4z"/>',
    airConditioning: '<path d="M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07 19.07 4.93"/>',
    television: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m8 2 4 3 4-3m-8 17v3m8-3v3"/>',
  };
  const amenities = page.querySelector("[data-room-amenities]");
  room.amenities.forEach((amenity) => {
    const item = document.createElement("li");
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = equipmentIcons[amenity];
    const label = document.createElement("span");
    label.textContent = equipmentLabels[amenity];
    item.append(icon, label);
    amenities.append(item);
  });

  const searchForm = page.querySelector("[data-room-date-form]");
  page.querySelector(".room-detail__booking").insertBefore(
    occupiedSection,
    searchForm
  );
  window.MGH_DATA.getOccupiedPeriods()
    .then((periods) => {
      const roomPeriods = periods.filter((period) => period.roomId === roomId);
      occupiedContent.replaceChildren();

      if (roomPeriods.length === 0) {
        occupiedContent.textContent = labels.occupiedEmpty;
        return;
      }

      const list = document.createElement("ul");
      roomPeriods.forEach((period) => {
        const checkIn = occupiedDateFormatter.format(
          new Date(`${period.checkIn}T00:00:00Z`)
        );
        const checkOut = occupiedDateFormatter.format(
          new Date(`${period.checkOut}T00:00:00Z`)
        );
        const item = document.createElement("li");
        item.textContent = labels.occupiedRange(checkIn, checkOut);
        list.append(item);
      });
      occupiedContent.append(list);
    })
    .catch((error) => {
      console.error("Could not load occupied room periods.", error);
      occupiedContent.textContent = labels.occupiedError;
    });

  const arrival = searchForm.elements.arrivalDate;
  const departure = searchForm.elements.departureDate;
  const availabilityMessage = document.createElement("p");
  availabilityMessage.className = "form-status";
  availabilityMessage.setAttribute("role", "status");
  availabilityMessage.setAttribute("aria-live", "polite");
  searchForm.after(availabilityMessage);
  const today = new Date();
  const todayString = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  arrival.min = todayString;
  arrival.value = query.get("arrivalDate") || "";
  departure.value = query.get("departureDate") || "";
  departure.min = arrival.value || arrival.min;
  const reserve = page.querySelector("[data-room-reserve]");
  const bookingBar = document.createElement("div");
  bookingBar.className = "room-booking-bar";
  bookingBar.setAttribute("aria-label", isFrench ? "Accès rapide à la réservation" : "Quick booking access");
  const bookingBarLink = document.createElement("a");
  bookingBarLink.textContent = labels.reserve;
  bookingBar.append(bookingBarLink);
  page.append(bookingBar);
  let availabilityState = null;
  let availabilityRequest = 0;
  const setReservationLinksDisabled = (disabled) => {
    [reserve, bookingBarLink].forEach((link) => {
      link.setAttribute("aria-disabled", String(disabled));
      if (disabled) link.setAttribute("tabindex", "-1");
      else link.removeAttribute("tabindex");
    });
  };
  [reserve, bookingBarLink].forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
      }
    });
  });
  const updateBookingLink = () => {
    departure.min = arrival.value || arrival.min;
    const languageLink = document.querySelector("header > a[lang]");
    if (languageLink) {
      const target = new URL(languageLink.href);
      target.searchParams.set("room", roomId);
      if (arrival.value) target.searchParams.set("arrivalDate", arrival.value);
      else target.searchParams.delete("arrivalDate");
      if (departure.value) target.searchParams.set("departureDate", departure.value);
      else target.searchParams.delete("departureDate");
      languageLink.href = target.href;
    }
    const url = new URL(isFrench ? "reservation.html" : "booking.html", location.href);
    url.searchParams.set("room", roomId);
    if (arrival.value >= todayString && departure.value > arrival.value) {
      url.searchParams.set("arrivalDate", arrival.value);
      url.searchParams.set("departureDate", departure.value);
      reserve.href = url.href;
      bookingBarLink.href = url.href;
      setReservationLinksDisabled(availabilityState !== "available");
    } else {
      reserve.href = `${url.pathname}?room=${encodeURIComponent(roomId)}`;
      bookingBarLink.href = reserve.href;
      if (arrival.value || departure.value) {
        setReservationLinksDisabled(true);
      } else {
        setReservationLinksDisabled(false);
      }
    }
  };
  const checkAvailability = async () => {
    const requestId = ++availabilityRequest;
    const validStay =
      arrival.value >= todayString &&
      departure.value > arrival.value;

    if (!validStay) {
      availabilityState = null;
      availabilityMessage.textContent = "";
      updateBookingLink();
      return;
    }

    availabilityState = "checking";
    availabilityMessage.textContent = labels.availabilityChecking;
    updateBookingLink();

    try {
      const result = await window.MGH_DATA.getAvailability(
        roomId,
        arrival.value,
        departure.value
      );

      if (requestId !== availabilityRequest) return;

      availabilityState = result.status;
      availabilityMessage.textContent =
        labels[
          result.status === "available"
            ? "availabilityAvailable"
            : result.status === "occupied"
              ? "availabilityOccupied"
              : "availabilityUnavailable"
        ];

      if (Number.isInteger(result.nightlyRateXof) && result.nightlyRateXof > 0) {
        pricing.nightlyRate = result.nightlyRateXof;
        renderRate();
      }
      if (Number.isInteger(result.capacity) && result.capacity > 0) {
        room.capacity = result.capacity;
        text("[data-room-capacity]", String(result.capacity));
      }

      updateBookingLink();
    } catch (error) {
      if (requestId !== availabilityRequest) return;

      console.error("Could not verify room availability.", error);
      availabilityState = "error";
      availabilityMessage.textContent = labels.availabilityError;
      updateBookingLink();
    }
  };
  text("[data-date-arrival-label]", labels.arrival);
  text("[data-date-departure-label]", labels.departure);
  reserve.textContent = labels.reserve;
  [arrival, departure].forEach((field) => field.addEventListener("input", () => {
    departure.setCustomValidity("");
    updateBookingLink();
    checkAvailability();
  }));
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!arrival.value || !departure.value || departure.value <= arrival.value) {
      departure.setCustomValidity(labels.invalidDates);
      departure.reportValidity();
      return;
    }
    departure.setCustomValidity("");
    updateBookingLink();
    checkAvailability();
  });
  checkAvailability();

  const gallery = page.querySelector("[data-room-gallery]");
  const dialog = page.querySelector("[data-room-lightbox]");
  const dialogImage = dialog.querySelector("img");
  dialogImage.width = 900;
  dialogImage.height = 600;
  dialogImage.loading = "lazy";
  const closeButton = dialog.querySelector("[data-lightbox-close]");
  const previousButton = dialog.querySelector("[data-lightbox-previous]");
  const nextButton = dialog.querySelector("[data-lightbox-next]");
  const photos = [room.image, ...config.roomPhotos.filter(
    (image) => image.startsWith("chambre-") && image !== room.image,
  )];
  let activeIndex = 0;
  let pointerStartX = null;
  const photoAlt = (image) => image === room.image
    ? isFrench ? room.imageAltFr : room.imageAltEn
    : isFrench ? "Photo d’un espace d’hébergement" : "Guest accommodation photo";
  const showPhoto = (index) => {
    activeIndex = (index + photos.length) % photos.length;
    dialogImage.src = `${imageBase}${photos[activeIndex]}`;
    dialogImage.alt = photoAlt(photos[activeIndex]);
    dialog.querySelector("[data-lightbox-counter]").textContent = `${activeIndex + 1} / ${photos.length}`;
  };
  gallery.replaceChildren(...photos.map((image, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "room-gallery__item";
    button.setAttribute("aria-label", `${labels.photo} ${index + 1} / ${photos.length}`);
    const photo = document.createElement("img");
    photo.src = `${imageBase}${image}`;
    photo.alt = photoAlt(image);
    photo.width = 900;
    photo.height = 600;
    photo.loading = "lazy";
    photo.decoding = "async";
    button.append(photo);
    button.addEventListener("click", () => {
      showPhoto(index);
      dialog.showModal();
      closeButton.focus();
    });
    return button;
  }));
  mainImage.tabIndex = 0;
  mainImage.setAttribute("role", "button");
  mainImage.setAttribute("aria-label", isFrench ? "Agrandir la photo principale" : "Enlarge main photo");
  mainImage.addEventListener("click", () => {
    showPhoto(0);
    dialog.showModal();
    closeButton.focus();
  });
  mainImage.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      mainImage.click();
    }
  });
  closeButton.setAttribute("aria-label", labels.close);
  previousButton.setAttribute("aria-label", labels.previous);
  nextButton.setAttribute("aria-label", labels.next);
  previousButton.addEventListener("click", () => showPhoto(activeIndex - 1));
  nextButton.addEventListener("click", () => showPhoto(activeIndex + 1));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showPhoto(activeIndex - 1);
    if (event.key === "ArrowRight") showPhoto(activeIndex + 1);
    if (event.key === "Escape") dialog.close();
  });
  dialogImage.addEventListener("pointerdown", (event) => {
    pointerStartX = event.clientX;
  });
  dialogImage.addEventListener("pointerup", (event) => {
    if (pointerStartX === null) return;
    const delta = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(delta) > 40) showPhoto(activeIndex + (delta < 0 ? 1 : -1));
  });
})();

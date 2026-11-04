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
  .mgh-form-message { margin: .75rem 0; padding: .7rem .9rem; border-left: 3px solid #c6a15b; color: inherit; background: rgb(198 161 91 / 12%); }
  .mgh-form-message[data-state="error"] { border-left-color: #b65c57; }
  .mgh-summary { margin: 1rem 0; padding: 1rem; border: 1px solid currentColor; border-radius: .5rem; }
  .mgh-summary h3 { margin-top: 0; }
  .mgh-summary ul { margin-bottom: 0; }
  .mgh-summary button { margin: .75rem .5rem 0 0; }
  .mgh-toast { position: fixed; z-index: 1100; right: 1rem; bottom: 1rem; max-width: min(28rem, calc(100vw - 2rem)); padding: .85rem 1rem; border: 1px solid currentColor; border-radius: .5rem; color: #f5f7fa; background: #102a43; box-shadow: 0 8px 24px rgb(0 0 0 / 24%); }
  @media (prefers-reduced-motion: reduce) { .mgh-reveal { opacity: 1 !important; transform: none !important; } }
`;
document.head.append(styleElement);

const getTodayString = () => {
  const today = new Date();
  return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
};

const getFormMessage = (form) => {
  let message = form.querySelector("[data-form-message]");
  if (!message) {
    message = document.createElement("p");
    message.className = "mgh-form-message";
    message.dataset.formMessage = "";
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    form.append(message);
  }
  return message;
};

const getReservationFieldError = (form, field) => {
  const labels = getReservationLabels(form);
  if (field.validity.customError) return field.validationMessage;
  if (field.type === "checkbox" && field.validity.valueMissing) return labels.consent;
  if (field.validity.valueMissing) return labels.required;
  if (field.validity.typeMismatch && field.type === "email") return labels.emailError;
  if (field.validity.rangeUnderflow && field.type === "date") return labels.past;
  if (field.validity.rangeUnderflow || field.validity.badInput || field.validity.stepMismatch) return labels.number;
  return labels.invalid;
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

const getReservationLabels = (form) => form.dataset.language === "fr"
  ? {
      title: "Demande de réservation — Mary’s Guest House", name: "Nom complet", email: "Adresse e-mail", phone: "Téléphone",
      arrival: "Date d’arrivée", departure: "Date de départ", guests: "Nombre de personnes", roomType: "Type de chambre souhaité",
      rooms: "Nombre de chambres", date: "Date souhaitée", time: "Heure souhaitée", message: "Message complémentaire",
      nights: "Nuits", price: "Montant estimatif", toConfirm: "Tarif à confirmer par l’établissement.",
      review: "Vérifiez votre récapitulatif avant de continuer.", confirm: "Continuer vers WhatsApp", edit: "Modifier ma demande",
      invalid: "Vérifiez les champs signalés avant de continuer.", dates: "La date de départ doit être postérieure à la date d’arrivée.",
      required: "Ce champ est obligatoire.", emailError: "Saisissez une adresse e-mail valide.", consent: "Veuillez accepter le consentement avant de continuer.",
      past: "Choisissez une date qui n’est pas passée.", number: "Saisissez un nombre entier supérieur à zéro.",
      opening: "Ouverture de WhatsApp…", noConfirmation: "Envoyez la demande dans WhatsApp. L’établissement devra confirmer les disponibilités.",
    }
  : {
      title: "Reservation request — Mary’s Guest House", name: "Full name", email: "Email address", phone: "Phone",
      arrival: "Check-in date", departure: "Check-out date", guests: "Number of guests", roomType: "Preferred room type",
      rooms: "Number of rooms", date: "Preferred date", time: "Preferred time", message: "Additional message",
      nights: "Nights", price: "Estimated amount", toConfirm: "Rate to be confirmed by the property.",
      review: "Review your request before continuing.", confirm: "Continue to WhatsApp", edit: "Edit my request",
      invalid: "Please check the fields marked below before continuing.", dates: "Check-out must be after check-in.",
      required: "This field is required.", emailError: "Enter a valid email address.", consent: "Please accept the consent before continuing.",
      past: "Choose a date that is not in the past.", number: "Enter a whole number greater than zero.",
      opening: "Opening WhatsApp…", noConfirmation: "Send the request in WhatsApp. The property must confirm availability.",
    };

const validateReservation = (form, report = true) => {
  const labels = getReservationLabels(form);
  const today = getTodayString();
  const arrival = form.querySelector('[name="arrivalDate"]');
  const departure = form.querySelector('[name="departureDate"]');
  const singleDate = form.querySelector('[name="date"]');
  const people = form.querySelector('[name="guests"], [name="people"]');
  const rooms = form.querySelector('[name="rooms"]');

  if (arrival && departure) {
    arrival.min = today;
    departure.min = arrival.value || today;
    arrival.setCustomValidity(arrival.value && arrival.value < today ? labels.past : "");
    departure.setCustomValidity(
      departure.value && departure.value < today
        ? labels.past
        : departure.value && arrival.value && departure.value <= arrival.value
          ? labels.dates
          : "",
    );
  }
  if (singleDate) {
    singleDate.min = today;
    singleDate.setCustomValidity(singleDate.value && singleDate.value < today ? labels.past : "");
  }
  [people, rooms].filter(Boolean).forEach((input) => {
    const isVisible = !input.closest("[hidden]");
    const valid = !isVisible || (Number.isInteger(Number(input.value)) && Number(input.value) > 0);
    input.setCustomValidity(valid ? "" : labels.number);
  });

  const isValid = report
    ? form.checkValidity()
    : [...form.elements].every((field) => !field.willValidate || field.validity.valid);
  if (!isValid) {
    if (!report) return false;
    const invalidField = [...form.elements].find((field) => field.willValidate && !field.checkValidity());
    const message = getFormMessage(form);
    message.dataset.state = "error";
    message.textContent = invalidField?.validationMessage || labels.invalid;
    invalidField?.focus();
    form.reportValidity();
    return false;
  }
  return true;
};

const getNightCount = (arrival, departure) => {
  if (!arrival || !departure) return 0;
  const [arrivalYear, arrivalMonth, arrivalDay] = arrival.split("-").map(Number);
  const [departureYear, departureMonth, departureDay] = departure.split("-").map(Number);
  return (Date.UTC(departureYear, departureMonth - 1, departureDay) - Date.UTC(arrivalYear, arrivalMonth - 1, arrivalDay)) / 86400000;
};

const getReservationSummary = (form) => {
  const values = new FormData(form);
  const labels = getReservationLabels(form);
  const isFrench = form.dataset.language === "fr";
  const rows = [];
  const addRow = (label, value) => {
    if (value) rows.push(`${label} : ${value}`);
  };
  addRow(labels.name, values.get("name")?.toString().trim());
  addRow(labels.email, values.get("email")?.toString().trim());
  addRow(labels.phone, values.get("phone")?.toString().trim());

  const requestType = values.get("requestType")?.toString();
  if (requestType) {
    const typeLabels = isFrench
      ? { room: "Réservation d’une chambre", table: "Réservation d’une table au restaurant" }
      : { room: "Room reservation", table: "Restaurant table reservation" };
    addRow(isFrench ? "Type de demande" : "Request type", typeLabels[requestType] || requestType);
  }

  const arrival = values.get("arrivalDate")?.toString();
  const departure = values.get("departureDate")?.toString();
  const singleDate = values.get("date")?.toString();
  const dateFormatter = new Intl.DateTimeFormat(isFrench ? "fr-FR" : "en-GB", { dateStyle: "long", timeZone: "UTC" });
  if (arrival && departure) {
    addRow(labels.arrival, dateFormatter.format(new Date(`${arrival}T00:00:00Z`)));
    addRow(labels.departure, dateFormatter.format(new Date(`${departure}T00:00:00Z`)));
    const nights = getNightCount(arrival, departure);
    addRow(labels.nights, `${nights} ${labels.nights.toLowerCase()}`);
    const roomType = form.querySelector('[name="roomType"]');
    const rate = Number(roomType?.selectedOptions[0]?.dataset.pricePerNight);
    const roomCount = Number(values.get("rooms") || 1);
    if (Number.isFinite(rate) && rate > 0) {
      const currency = form.dataset.currency || "XOF";
      const amount = new Intl.NumberFormat(isFrench ? "fr-FR" : "en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(rate * nights * roomCount);
      addRow(labels.price, amount);
    } else {
      addRow(labels.price, labels.toConfirm);
    }
  } else if (singleDate) {
    addRow(labels.date, dateFormatter.format(new Date(`${singleDate}T00:00:00Z`)));
  }

  addRow(labels.roomType, values.get("roomType")?.toString());
  addRow(labels.guests, values.get("guests")?.toString() || values.get("people")?.toString());
  if (requestType !== "table") addRow(labels.rooms, values.get("rooms")?.toString());
  addRow(labels.time, values.get("time")?.toString());
  addRow(labels.message, values.get("message")?.toString().trim());
  return rows;
};

const buildReservationUrl = (form) => {
  const labels = getReservationLabels(form);
  const lines = [labels.title, "", ...getReservationSummary(form)];
  const whatsappUrl = new URL("https://wa.me/22893541512");
  whatsappUrl.searchParams.set("text", lines.join("\n"));
  return whatsappUrl;
};

const createReservationSummary = (form) => {
  let summary = form.querySelector("[data-reservation-summary]");
  if (!summary) {
    summary = document.createElement("section");
    summary.className = "mgh-summary";
    summary.dataset.reservationSummary = "";
    const heading = document.createElement("h3");
    heading.textContent = form.dataset.language === "fr" ? "Récapitulatif" : "Request summary";
    const list = document.createElement("ul");
    const continueButton = document.createElement("button");
    continueButton.type = "submit";
    continueButton.dataset.confirmReservation = "";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.dataset.editReservation = "";
    editButton.textContent = getReservationLabels(form).edit;
    summary.append(heading, list, continueButton, editButton);
    const actions = form.querySelector(".reservation-form__actions");
    form.insertBefore(summary, actions || null);
    editButton.addEventListener("click", () => {
      form.dataset.reviewing = "false";
      setDisclosure(summary, false);
      const submitButton = form.querySelector('.reservation-form__actions button[type="submit"]');
      if (submitButton) submitButton.textContent = submitButton.dataset.defaultLabel || submitButton.textContent;
      getFormMessage(form).textContent = "";
    });
  }

  const list = summary.querySelector("ul");
  list.replaceChildren();
  getReservationSummary(form).forEach((row) => {
    const item = document.createElement("li");
    item.textContent = row;
    list.append(item);
  });
  const continueButton = summary.querySelector("[data-confirm-reservation]");
  continueButton.textContent = getReservationLabels(form).confirm;
  setDisclosure(summary, true);
  summary.classList.add("mgh-summary");
  form.dataset.reviewing = "true";
  const submitButton = form.querySelector('.reservation-form__actions button[type="submit"]');
  if (submitButton) {
    submitButton.dataset.defaultLabel ||= submitButton.textContent;
    submitButton.textContent = getReservationLabels(form).confirm;
  }
};

const handleReservationSubmit = (form, event) => {
  event.preventDefault();
  if (form.dataset.submitting === "true") return;

  const labels = getReservationLabels(form);
  if (!validateReservation(form)) {
    form.dataset.reviewing = "false";
    return;
  }

  if (form.dataset.reviewing !== "true") {
    createReservationSummary(form);
    const message = getFormMessage(form);
    message.dataset.state = "info";
    message.textContent = labels.review;
    showToast(labels.review);
    return;
  }

  const url = buildReservationUrl(form);
  setLoading(form, true, labels.opening);
  getFormMessage(form).textContent = labels.noConfirmation;
  showToast(labels.noConfirmation);
  window.location.assign(url);
};

const reservationForms = document.querySelectorAll("[data-reservation-form]");

reservationForms.forEach((form) => {
  form.addEventListener("invalid", (event) => {
    if (form.dataset.invalidMessageSet === "true") return;
    form.dataset.invalidMessageSet = "true";
    const message = getFormMessage(form);
    message.dataset.state = "error";
    message.textContent = getReservationFieldError(form, event.target);
    queueMicrotask(() => delete form.dataset.invalidMessageSet);
  }, true);

  const arrivalDate = form.querySelector('[name="arrivalDate"]');
  const departureDate = form.querySelector('[name="departureDate"]');
  const singleDate = form.querySelector('[name="date"]');
  const dateFields = [arrivalDate, departureDate, singleDate].filter(Boolean);

  dateFields.forEach((dateField) => {
    dateField.min = getTodayString();
    dateField.addEventListener("input", () => {
      validateReservation(form, false);
      form.dataset.reviewing = "false";
    });
    dateField.addEventListener("change", () => {
      validateReservation(form, false);
      form.dataset.reviewing = "false";
    });
  });

  const typeSelect = form.querySelector('[name="requestType"]');
  const timeField = form.querySelector('[data-request-field="time"]');
  const peopleField = form.querySelector('[data-request-field="people"]');
  const roomsField = form.querySelector('[data-request-field="rooms"]');
  if (typeSelect && timeField && peopleField && roomsField) {
    const fieldsByType = { room: [roomsField], table: [timeField, peopleField] };
    const updateRequestFields = () => {
      const visibleFields = fieldsByType[typeSelect.value] ?? fieldsByType.room;
      [timeField, peopleField, roomsField].forEach((field) => {
        const isVisible = visibleFields.includes(field);
        const input = field.querySelector("input");
        field.hidden = !isVisible;
        input.required = isVisible;
      });
      form.dataset.reviewing = "false";
    };
    typeSelect.addEventListener("change", updateRequestFields);
    updateRequestFields();
  }

  form.addEventListener("input", (event) => {
    if (event.target.matches('input[type="number"]')) validateReservation(form, false);
    const message = form.querySelector("[data-form-message]");
    const formIsValid = [...form.elements].every((field) => !field.willValidate || field.validity.valid);
    if (message?.dataset.state === "error" && formIsValid) {
      message.textContent = "";
      delete message.dataset.state;
    }
    if (form.dataset.reviewing === "true" && !event.target.matches("[data-confirm-reservation]")) {
      form.dataset.reviewing = "false";
      const summary = form.querySelector("[data-reservation-summary]");
      if (summary) setDisclosure(summary, false);
      const submitButton = form.querySelector('.reservation-form__actions button[type="submit"]');
      if (submitButton?.dataset.defaultLabel) submitButton.textContent = submitButton.dataset.defaultLabel;
    }
  });

  form.addEventListener("submit", (event) => handleReservationSubmit(form, event));
});

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
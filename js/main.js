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

document.querySelectorAll("img").forEach((image) => {
  if (!image.hasAttribute("width")) image.width = 900;
  if (!image.hasAttribute("height")) image.height = 600;
});

const isFrenchSite = document.documentElement.lang.toLowerCase().startsWith("fr");
const isEnglishDirectory = location.pathname.toLowerCase().includes("/en/");
const ensureMeta = (attribute, key, content) => {
  let meta = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.append(meta);
  }
  if (!meta.content) meta.content = content;
};
const pageDescription = document.querySelector('meta[name="description"]')?.content
  || document.title;
const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href
  || `${location.origin}${location.pathname}`;
ensureMeta("property", "og:title", document.title);
ensureMeta("property", "og:description", pageDescription);
ensureMeta("property", "og:type", "website");
ensureMeta("property", "og:url", canonicalUrl);
ensureMeta("property", "og:site_name", "Mary’s Guest House");
ensureMeta("property", "og:image", "https://maryguesthouse.com/assets/images/chambre-lit-rayures-bleues-01.jpg");
ensureMeta("property", "og:image:alt", isFrenchSite ? "Chambre avec literie rayée bleue" : "Room with blue striped bedding");
ensureMeta("property", "og:locale", isFrenchSite ? "fr_TG" : "en_TG");
ensureMeta("name", "twitter:card", "summary_large_image");
ensureMeta("name", "twitter:title", document.title);
ensureMeta("name", "twitter:description", pageDescription);

const siteRoutes = isFrenchSite
  ? [
      ["Équipements et accès", "services.html"],
    ]
  : [
      ["Facilities and directions", "services.html"],
    ];
const policyRoutes = isFrenchSite
  ? [["Confidentialité", "confidentialite.html"], ["Cookies", "cookies.html"]]
  : [["Privacy", "privacy.html"], ["Cookies", "cookies.html"]];
const footerRoutes = [...siteRoutes, ...policyRoutes];
const routeHref = (file) => `${isEnglishDirectory ? "" : isFrenchSite ? "" : "../"}${file}`;

document.querySelectorAll("header").forEach((header) => {
  const languageLink = header.querySelector(":scope > a[lang]");
  if (!languageLink || header.querySelector("[data-currency-picker]")) return;
  const wrapper = document.createElement("label");
  wrapper.className = "currency-picker";
  wrapper.dataset.currencyPicker = "";
  const label = document.createElement("span");
  label.textContent = isFrenchSite ? "Devise" : "Currency";
  const select = document.createElement("select");
  select.dataset.currencySelect = "";
  select.setAttribute("aria-label", label.textContent);
  [["XOF", "FCFA (XOF)"], ["EUR", "EUR"], ["USD", "USD"], ["INR", "INR"]]
    .forEach(([value, name]) => select.add(new Option(name, value)));
  try {
    const savedCurrency = localStorage.getItem("mghPreferredCurrency");
    if (["XOF", "EUR", "USD", "INR"].includes(savedCurrency)) select.value = savedCurrency;
  } catch (error) {
    console.warn("Could not read the preferred currency from local storage.", error);
  }
  select.addEventListener("change", () => {
    try {
      localStorage.setItem("mghPreferredCurrency", select.value);
    } catch (error) {
      console.warn("Could not save the preferred currency to local storage.", error);
    }
    document.dispatchEvent(new CustomEvent("mgh-currency-change", { detail: { currency: select.value } }));
  });
  wrapper.append(label, select);
  languageLink.before(wrapper);
});

document.querySelectorAll("header nav").forEach((navigation) => {
  const links = [...navigation.querySelectorAll("a")].map((link) => link.getAttribute("href"));
  siteRoutes.forEach(([label, file]) => {
    const href = routeHref(file);
    if (links.includes(href)) return;
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    item.append(link);
    navigation.querySelector("ul")?.append(item);
  });
});

document.querySelectorAll("footer nav").forEach((navigation) => {
  const list = navigation.querySelector("ul");
  if (!list) return;
  footerRoutes.forEach(([label, file]) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = routeHref(file);
    link.textContent = label;
    item.append(link);
    list.append(item);
  });
});
document.querySelectorAll("footer").forEach((footer) => {
  if (footer.querySelector("nav")) return;
  const navigation = document.createElement("nav");
  navigation.setAttribute("aria-label", isFrenchSite ? "Liens de pied de page" : "Footer links");
  const list = document.createElement("ul");
  footerRoutes.forEach(([label, file]) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = routeHref(file);
    link.textContent = label;
    item.append(link);
    list.append(item);
  });
  navigation.append(list);
  footer.prepend(navigation);
});

if (!document.querySelector("[data-cookie-banner]")) {
  let cookieChoice = null;
  try {
    cookieChoice = localStorage.getItem("mghCookieChoice");
  } catch (error) {
    console.warn("Could not read the cookie preference.", error);
  }
  if (!cookieChoice) {
    const banner = document.createElement("aside");
    banner.className = "cookie-banner";
    banner.dataset.cookieBanner = "";
    banner.setAttribute("aria-label", isFrenchSite ? "Préférences de confidentialité" : "Privacy preferences");
    const message = document.createElement("p");
    message.textContent = isFrenchSite
      ? "Ce site utilise le stockage local pour ses fonctionnalités. Aucun cookie publicitaire ou analytique n’est configuré."
      : "This site uses local storage for its features. No advertising or analytics cookies are configured.";
    const actions = document.createElement("div");
    actions.className = "cookie-banner__actions";
    const accept = document.createElement("button");
    accept.type = "button";
    accept.textContent = isFrenchSite ? "Compris" : "Understood";
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.textContent = isFrenchSite ? "Fermer" : "Close";
    const saveChoice = (choice) => {
      try {
        localStorage.setItem("mghCookieChoice", choice);
      } catch (error) {
        console.warn("Could not save the cookie preference.", error);
      }
      banner.remove();
    };
    accept.addEventListener("click", () => saveChoice("acknowledged"));
    dismiss.addEventListener("click", () => saveChoice("dismissed"));
    actions.append(accept, dismiss);
    banner.append(message, actions);
    document.body.append(banner);
  }
}

document.querySelectorAll("main").forEach((main) => {
  if (!main.querySelector("[data-gallery-section]")) return;
  const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
  const gallerySections = [...main.querySelectorAll("[data-gallery-section]")];
  if (!gallerySections.some((section) => section.dataset.gallerySection === "exterior")) {
    const exterior = document.createElement("section");
    exterior.dataset.gallerySection = "exterior";
    exterior.setAttribute("aria-label", isEnglish ? "Exterior" : "Extérieur");
    const heading = document.createElement("h2");
    heading.textContent = isEnglish ? "Exterior" : "Extérieur";
    const notice = document.createElement("p");
    notice.textContent = isEnglish
      ? "No identifiable exterior photo is currently available."
      : "Aucune photo extérieure identifiable n’est actuellement disponible.";
    exterior.append(heading, notice);
    main.append(exterior);
    gallerySections.push(exterior);
  }
  const controls = document.createElement("div");
  controls.className = "gallery-filters";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", isEnglish ? "Filter gallery" : "Filtrer la galerie");
  const categories = [
    ["all", isEnglish ? "All" : "Tout"],
    ["rooms", isEnglish ? "Rooms" : "Chambres"],
    ["restaurant", "Restaurant"],
    ["exterior", isEnglish ? "Exterior" : "Extérieur"],
  ];
  categories.forEach(([category, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-pressed", String(category === "all"));
    button.addEventListener("click", () => {
      gallerySections.forEach((section) => {
        section.hidden = category !== "all" && section.dataset.gallerySection !== category;
      });
      controls.querySelectorAll("button").forEach((control) => {
        control.setAttribute("aria-pressed", String(control === button));
      });
    });
    controls.append(button);
  });
  gallerySections[0].before(controls);

  const dialog = document.createElement("dialog");
  dialog.className = "gallery-lightbox";
  dialog.setAttribute("aria-label", isEnglish ? "Gallery photo" : "Photo de la galerie");
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = isEnglish ? "Close" : "Fermer";
  close.setAttribute("aria-label", isEnglish ? "Close photo" : "Fermer la photo");
  const previous = document.createElement("button");
  previous.type = "button";
  previous.textContent = isEnglish ? "Previous" : "Précédente";
  const next = document.createElement("button");
  next.type = "button";
  next.textContent = isEnglish ? "Next" : "Suivante";
  const image = document.createElement("img");
  image.width = 900;
  image.height = 600;
  image.loading = "lazy";
  const counter = document.createElement("p");
  counter.setAttribute("aria-live", "polite");
  dialog.append(close, previous, image, next, counter);
  document.body.append(dialog);
  const photos = [...main.querySelectorAll("[data-gallery-section] img")];
  let activeIndex = 0;
  const showPhoto = (index) => {
    activeIndex = (index + photos.length) % photos.length;
    image.src = photos[activeIndex].currentSrc || photos[activeIndex].src;
    image.alt = photos[activeIndex].alt;
    counter.textContent = `${activeIndex + 1} / ${photos.length}`;
  };
  photos.forEach((photo, index) => {
    photo.tabIndex = 0;
    photo.setAttribute("role", "button");
    photo.setAttribute("aria-label", `${photo.alt} — ${isEnglish ? "enlarge" : "agrandir"}`);
    photo.addEventListener("click", () => {
      showPhoto(index);
      dialog.showModal();
      close.focus();
      close.focus();
    });
    photo.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        photo.click();
      }
    });
  });
  close.addEventListener("click", () => dialog.close());
  previous.addEventListener("click", () => showPhoto(activeIndex - 1));
  next.addEventListener("click", () => showPhoto(activeIndex + 1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showPhoto(activeIndex - 1);
    if (event.key === "ArrowRight") showPhoto(activeIndex + 1);
    if (event.key === "Escape") dialog.close();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    dialog.close();
  });
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Hotel",
  name: "Mary’s Guest House",
  url: "https://maryguesthouse.com/",
  telephone: "+22893541512",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lomé",
    addressCountry: "TG",
  },
};
const jsonLd = document.createElement("script");
jsonLd.type = "application/ld+json";
jsonLd.textContent = JSON.stringify(structuredData);
document.head.append(jsonLd);
if (/restaurant|galerie|gallery/.test(location.pathname.toLowerCase())) {
  const restaurantJsonLd = document.createElement("script");
  restaurantJsonLd.type = "application/ld+json";
  restaurantJsonLd.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Mary’s Guest House Restaurant",
    url: isEnglishDirectory
      ? "https://maryguesthouse.com/en/restaurant.html"
      : "https://maryguesthouse.com/restaurant.html",
    telephone: "+22893541512",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lomé",
      addressCountry: "TG",
    },
  });
  document.head.append(restaurantJsonLd);
}

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
  if (window.MGH_DATA?.getTestimonials) {
    try {
      const testimonials = window.MGH_DATA.getTestimonials();
      if (!Array.isArray(testimonials)) throw new TypeError("The testimonial data source must return an array.");
      return testimonials;
    } catch (error) {
      console.error("Could not read testimonials from the configured data source.", error);
      return [];
    }
  }
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

  form.addEventListener("submit", async (event) => {
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
    const testimonial = {
      id: crypto.randomUUID(),
      firstName,
      rating: Number(values.get("rating")),
      comment,
      moderationStatus: "pending",
      submittedAt: new Date().toISOString(),
    };

    let submission;
    try {
      submission = window.MGH_DATA?.submitTestimonial
        ? await window.MGH_DATA.submitTestimonial(testimonial)
        : (() => {
            const testimonials = readTestimonials();
            testimonials.push(testimonial);
            return { success: saveTestimonials(testimonials) };
          })();
    } catch (error) {
      console.error("Could not submit the testimonial.", error);
    }
    if (!submission?.success) {
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
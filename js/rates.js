(() => {
  const config = window.MGH_CONFIG;
  const list = document.querySelector("[data-rate-list]");
  const note = document.querySelector("[data-rate-note]");
  if (!list || !note) return;
  if (!config) {
    note.textContent = document.documentElement.lang.startsWith("fr")
      ? "Les tarifs ne sont pas disponibles actuellement."
      : "Rates are not available right now.";
    return;
  }

  const isFrench = document.documentElement.lang.toLowerCase().startsWith("fr");
  const locale = isFrench ? "fr-FR" : "en-GB";
  const nameByKey = isFrench
    ? { standard: "Chambre standard", vip: "Chambre VIP" }
    : { standard: "Standard room", vip: "VIP room" };
  let currency = config.currency.default;
  try {
    const saved = localStorage.getItem("mghPreferredCurrency");
    if (Object.hasOwn(config.currency.xofPerCurrency, saved)) currency = saved;
  } catch (error) {
    console.warn("Could not read the preferred currency from local storage.", error);
  }

  const formatMoney = (amountXof) => {
    const amount = amountXof / config.currency.xofPerCurrency[currency];
    if (currency === "XOF") {
      return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)} FCFA`;
    }
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  const renderRates = () => {
    list.replaceChildren(...Object.entries(config.pricing).map(([key, pricing]) => {
      const item = document.createElement("li");
      const separator = isFrench ? " :" : ":";
      item.textContent = `${nameByKey[key] || key}${separator} ${pricing.rateType === "from" ? isFrench ? "à partir de " : "from " : ""}${formatMoney(pricing.nightlyRate)} / ${isFrench ? "nuit" : "night"}`;
      return item;
    }));
    note.textContent = currency === "XOF"
      ? isFrench ? "Les tarifs sont définis et facturés en FCFA." : "Rates are set and billed in XOF."
      : isFrench
        ? `Montant indicatif, facturation en FCFA. Taux de référence : ${config.currency.updatedOn}.`
        : `Indicative amount; billing is in XOF. Reference rates: ${config.currency.updatedOn}.`;
  };
  renderRates();
  document.addEventListener("mgh-currency-change", (event) => {
    currency = event.detail.currency;
    renderRates();
  });
})();

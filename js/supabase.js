
(() => {
  "use strict";

  const SUPABASE_URL = "https://lewdluivyxdjggysdkzz.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_nXwoVBO0FKtGNsTCQxM9kA_evfX6lF3";

  // Vérifier que la bibliothèque Supabase est chargée.
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error(
      "Mary's Guest House : la bibliothèque Supabase n'a pas été chargée."
    );
    window.MGH_SUPABASE = null;
    return;
  }

  try {
    // Créer le client Supabase.
    window.MGH_SUPABASE = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    console.info("Mary's Guest House : connexion Supabase initialisée.");
  } catch (error) {
    console.error(
      "Mary's Guest House : impossible d'initialiser Supabase.",
      error
    );
    window.MGH_SUPABASE = null;
  }
})();

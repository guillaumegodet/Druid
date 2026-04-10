
/** 
 * Mapping des laboratoires par pôle de recherche.
 * Permet de déduire le pôle à partir de l'appartenance principale (Labo).
 */
export const POLE_LAB_MAPPING: Record<string, string[]> = {
  "Pôle Humanités": [
    "CAPHI", "CFV", "CReAAH", "CREN", "CRHIA", "CRINI", 
    "ESO", "LAMO", "LETG", "LLING", "LPPL"
  ],
  "Pôle S&T": [
    "CEISAM", "GeM", "GEPEA", "IETR", "IMN", "IREENA", 
    "LMJL", "LPG", "LS2N", "LTeN", "SUBATECH", "US2B"
  ],
  "Pôle Santé": [
    "CR2TI", "CRCI2NA", "IICiMed", "INCIT", "ISOMER", "MIP", 
    "PHAN", "RMeS", "SPHERE", "TaRGeT", "TENS", "ITX"
  ],
  "Pôle Sociétés": [
    "CDMO", "CENS", "DCS", "IRDP", "LEMNA"
  ]
};

/** 
 * Fonction utilitaire pour trouver le pôle d'un laboratoire.
 * Recherche par correspondance exacte ou inclusion (ignore la casse).
 */
export const getPoleFromLab = (labName: any): string | null => {
  if (!labName) return null;
  
  // Handling array response from Grist ReferenceLists
  const normalizedLab = Array.isArray(labName) ? labName[0] : String(labName);
  const upperLab = normalizedLab.toUpperCase().trim();
  
  const entry = Object.entries(POLE_LAB_MAPPING).find(([_, labs]) => 
    labs.some(acronym => 
      upperLab === acronym || 
      upperLab.startsWith(acronym + " ") || 
      upperLab.includes(" " + acronym) ||
      upperLab.includes("(" + acronym + ")")
    )
  );
  return entry ? entry[0] : null;
};

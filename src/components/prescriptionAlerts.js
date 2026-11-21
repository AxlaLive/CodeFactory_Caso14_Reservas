const INTERACTION_RULES = [
  {
    medicine: ["warfarina"],
    other: ["ibuprofeno", "naproxeno", "aspirina"],
    message:
      "Los antiinflamatorios/aspirina junto con warfarina pueden aumentar el riesgo de sangrado.",
  },
  {
    medicine: ["metronidazol"],
    other: ["warfarina"],
    message:
      "Metronidazol puede aumentar el efecto anticoagulante de warfarina.",
  },
  {
    medicine: ["ibuprofeno", "naproxeno", "diclofenaco"],
    other: ["losartan", "enalapril", "lisinopril"],
    message:
      "AINEs junto con algunos antihipertensivos pueden afectar la función renal o el control de la presión.",
  },
];

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function allergyMatches(allergy, medication) {
  const knownGroups = [
    ["penicilina", "amoxicilina", "ampicilina", "amoxicillin", "penicillin"],
    ["sulfa", "sulfametoxazol", "trimetoprima", "sulfamethoxazole"],
    ["aspirina", "acido acetilsalicilico", "salicilato"],
    ["ibuprofeno", "naproxeno", "diclofenaco", "aine", "antiinflamatorio"],
    ["lidocaina", "anestesico local"],
  ];
  const allergyText = normalize(allergy);
  const medicineText = normalize(medication);
  if (!allergyText || !medicineText) return false;
  if (allergyText.includes(medicineText) || medicineText.includes(allergyText))
    return true;
  return knownGroups.some(
    (group) =>
      group.some((term) => allergyText.includes(normalize(term))) &&
      group.some((term) => medicineText.includes(normalize(term))),
  );
}

function getMedicationName(item) {
  return typeof item === "string" ? item : item?.name || item?.medication || "";
}

export function buildAlerts(medication, profile, prescriptions = []) {
  const alerts = [];
  (profile?.allergies || [])
    .filter((allergy) => allergyMatches(allergy, medication))
    .forEach((allergy) => {
      alerts.push({
        type: "allergy",
        text: `El paciente tiene registrada alergia a ${allergy}; verifica el medicamento o sus componentes antes de prescribir.`,
      });
    });
  const currentMedicines = [
    ...(profile?.medications || []).map(getMedicationName),
    ...(prescriptions || []).map((item) => item.medication),
  ].filter(Boolean);
  const prescribed = normalize(medication);
  currentMedicines.forEach((current) => {
    const normalizedCurrent = normalize(current);
    INTERACTION_RULES.forEach((rule) => {
      const newIsFirst =
        rule.medicine.some((name) => prescribed.includes(normalize(name))) &&
        rule.other.some((name) => normalizedCurrent.includes(normalize(name)));
      const newIsSecond =
        rule.other.some((name) => prescribed.includes(normalize(name))) &&
        rule.medicine.some((name) =>
          normalizedCurrent.includes(normalize(name)),
        );
      if (
        (newIsFirst || newIsSecond) &&
        !alerts.some(
          (alert) =>
            alert.type === "interaction" && alert.text.includes(current),
        )
      ) {
        alerts.push({
          type: "interaction",
          text: `Posible interacción entre ${medication} y ${current}: ${rule.message}`,
        });
      }
    });
  });
  return alerts;
}

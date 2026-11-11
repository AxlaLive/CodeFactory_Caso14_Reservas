import { test } from "node:test";
import assert from "node:assert/strict";
import { allergyMatches, buildAlerts } from "./prescriptionAlerts.js";

test("detecta alergia a penicilina al proponer amoxicilina", () => {
  assert.equal(allergyMatches("Penicilina", "Amoxicilina 500 mg"), true);
  assert.equal(allergyMatches("Penicilina", "Ibuprofeno"), false);
});

test("alerta de alergia forma parte de las alertas de prescripción", () => {
  const alerts = buildAlerts("Amoxicilina", { allergies: ["Penicilina"] }, []);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].type, "allergy");
});

test("detecta interacciones conocidas contra medicación actual", () => {
  const alerts = buildAlerts(
    "Ibuprofeno 400 mg",
    { medications: [{ name: "Warfarina" }] },
    [],
  );
  assert.equal(
    alerts.some((alert) => alert.type === "interaction"),
    true,
  );
  assert.deepEqual(
    buildAlerts("Paracetamol", { medications: [{ name: "Warfarina" }] }, []),
    [],
  );
});

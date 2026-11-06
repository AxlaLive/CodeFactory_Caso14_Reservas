import { useMemo, useState } from "react";
import { medicalRecordService } from "../api/medicalRecordService";

export { allergyMatches, buildAlerts } from "./prescriptionAlerts.js";
import { buildAlerts } from "./prescriptionAlerts.js";

const EMPTY_FORM = {
  medication: "",
  dosage: "",
  frequency: "",
  duration: "",
  quantity: "",
  route: "Oral",
  instructions: "",
};

export default function PrescriptionPanel({
  patientId,
  profile,
  records,
  session,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [alertsToConfirm, setAlertsToConfirm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const history = useMemo(
    () => records.prescriptions || [],
    [records.prescriptions],
  );

  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const validate = () => {
    const required = [
      "medication",
      "dosage",
      "frequency",
      "duration",
      "quantity",
      "route",
    ];
    if (required.some((field) => !String(form[field] || "").trim()))
      return "Completa todos los campos obligatorios de la receta.";
    if (!Number.isFinite(Number(form.duration)) || Number(form.duration) <= 0)
      return "La duración debe ser mayor que cero.";
    if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) <= 0)
      return "La cantidad debe ser un número entero mayor que cero.";
    return "";
  };

  const preparePrescription = async (confirmedAlerts = []) => {
    setSaving(true);
    setError("");
    try {
      const saved = await medicalRecordService.save(
        patientId,
        "prescriptions",
        {
          ...form,
          medication: form.medication.trim(),
          dosage: form.dosage.trim(),
          frequency: form.frequency.trim(),
          duration: `${form.duration} días`,
          quantity: Number(form.quantity),
          route: form.route,
          instructions: form.instructions.trim(),
          date: today,
          status: "active",
          professionalId: session.id,
          professionalName: session.name || session.username,
          confirmedAlerts: confirmedAlerts.map((alert) => alert.text),
        },
        session,
      );
      onSaved("prescriptions", saved);
      if (confirmedAlerts.length) {
        const decision = await medicalRecordService.save(
          patientId,
          "prescriptionDecisions",
          {
            date: today,
            medication: form.medication.trim(),
            decision: "confirmed",
            alerts: confirmedAlerts.map((alert) => alert.text),
            professionalId: session.id,
            professionalName: session.name || session.username,
            prescriptionId: saved.id,
          },
          session,
        );
        onSaved("prescriptionDecisions", decision);
      }
      setForm(EMPTY_FORM);
      setAlertsToConfirm(null);
      setNotice("Receta electrónica guardada en la historia clínica.");
      window.setTimeout(() => setNotice(""), 3500);
    } catch (caught) {
      setError(caught.message || "No fue posible guardar la receta.");
    } finally {
      setSaving(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    const alerts = buildAlerts(form.medication, profile, history);
    if (alerts.length) {
      setAlertsToConfirm(alerts);
      setError("");
      return;
    }
    preparePrescription();
  };

  const cancelWithAlert = async () => {
    setSaving(true);
    setError("");
    try {
      const decision = await medicalRecordService.save(
        patientId,
        "prescriptionDecisions",
        {
          date: today,
          medication: form.medication.trim(),
          decision: "cancelled",
          alerts: alertsToConfirm.map((alert) => alert.text),
          professionalId: session.id,
          professionalName: session.name || session.username,
        },
        session,
      );
      onSaved("prescriptionDecisions", decision);
      setAlertsToConfirm(null);
      setNotice(
        "Decisión de no emitir la receta registrada en la historia clínica.",
      );
      window.setTimeout(() => setNotice(""), 3500);
    } catch (caught) {
      setError(caught.message || "No fue posible registrar la decisión.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="medical-panel prescription-panel">
      <header className="medical-section-heading">
        <div>
          <span className="eyebrow">PRESCRIPCIÓN SEGURA</span>
          <h2>Receta electrónica</h2>
          <p>
            Usa la plantilla para registrar la indicación completa. Los avisos
            son orientativos y requieren criterio clínico.
          </p>
        </div>
      </header>
      <form className="prescription-form" onSubmit={submit}>
        <div className="prescription-template-label">
          <span>▤</span>
          <div>
            <strong>Plantilla de prescripción</strong>
            <small>
              La receta y su profesional emisor quedarán en la historia clínica
              de {profile?.name || "este paciente"}.
            </small>
          </div>
        </div>
        <div className="prescription-form-grid">
          <label className="prescription-field span-two">
            Medicamento / principio activo
            <input
              value={form.medication}
              onChange={(event) => update("medication", event.target.value)}
              placeholder="Ej. Amoxicilina 500 mg"
              required
            />
          </label>
          <label className="prescription-field">
            Dosis por toma
            <input
              value={form.dosage}
              onChange={(event) => update("dosage", event.target.value)}
              placeholder="Ej. 1 cápsula (500 mg)"
              required
            />
          </label>
          <label className="prescription-field">
            Frecuencia
            <input
              value={form.frequency}
              onChange={(event) => update("frequency", event.target.value)}
              placeholder="Ej. Cada 8 horas"
              required
            />
          </label>
          <label className="prescription-field">
            Duración (días)
            <input
              type="number"
              min="1"
              step="1"
              value={form.duration}
              onChange={(event) => update("duration", event.target.value)}
              placeholder="7"
              required
            />
          </label>
          <label className="prescription-field">
            Cantidad total
            <input
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={(event) => update("quantity", event.target.value)}
              placeholder="21"
              required
            />
          </label>
          <label className="prescription-field">
            Vía de administración
            <select
              value={form.route}
              onChange={(event) => update("route", event.target.value)}
              required
            >
              <option>Oral</option>
              <option>Tópica</option>
              <option>Subcutánea</option>
              <option>Intramuscular</option>
              <option>Intravenosa</option>
              <option>Bucal</option>
              <option>Otra</option>
            </select>
          </label>
          <label className="prescription-field span-two">
            Indicaciones adicionales
            <textarea
              value={form.instructions}
              onChange={(event) => update("instructions", event.target.value)}
              rows="3"
              placeholder="Ej. Tomar con alimentos. No suspender antes de completar el tratamiento."
            />
          </label>
        </div>
        <p className="prescription-safety-note">
          La revisión automática es limitada: confirma alergias, medicación
          concomitante, dosis y contraindicaciones antes de emitir.
        </p>
        {error && (
          <p className="medical-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="prescription-notice" role="status">
            ✓ {notice}
          </p>
        )}
        <button
          type="submit"
          className="primary-button prescription-submit"
          disabled={saving}
        >
          {saving ? "Guardando…" : "＋ Revisar y emitir receta"}
        </button>
      </form>
      <section className="prescription-history">
        <h3>Recetas emitidas</h3>
        {history.length === 0 ? (
          <p className="prescription-empty">
            Aún no hay recetas electrónicas registradas para este paciente.
          </p>
        ) : (
          history.map((item) => (
            <article key={item.id} className="prescription-history-item">
              <div className="prescription-history-date">{item.date}</div>
              <div>
                <strong>{item.medication}</strong>
                <p>
                  {item.dosage} · {item.frequency} · {item.duration} ·{" "}
                  {item.quantity} unidades · Vía {item.route}
                </p>
                {item.instructions && <small>{item.instructions}</small>}
                <small>
                  Emitida por {item.professionalName || "Profesional"}
                </small>
                {item.confirmedAlerts?.length > 0 && (
                  <small className="prescription-history-alert">
                    Emitida con alerta clínica confirmada.
                  </small>
                )}
              </div>
            </article>
          ))
        )}
      </section>
      {alertsToConfirm && (
        <div
          className="medical-editor-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prescription-alert-title"
        >
          <section className="medical-editor prescription-alert-dialog">
            <header>
              <div>
                <span className="eyebrow">Verificación clínica requerida</span>
                <h2 id="prescription-alert-title">
                  Revisa las alertas antes de continuar
                </h2>
              </div>
              <button
                type="button"
                onClick={cancelWithAlert}
                aria-label="Cancelar prescripción y registrar decisión"
              >
                ×
              </button>
            </header>
            <div className="prescription-alert-list">
              {alertsToConfirm.map((alert, index) => (
                <div
                  className={`prescription-alert prescription-alert-${alert.type}`}
                  role="alert"
                  key={`${alert.type}-${index}`}
                >
                  <strong>
                    {alert.type === "allergy"
                      ? "Posible alergia"
                      : "Posible interacción"}
                  </strong>
                  <p>{alert.text}</p>
                </div>
              ))}
            </div>
            <p className="prescription-confirm-copy">
              Si decides continuar, se guardará la receta y tu decisión
              explícita en la historia clínica. Si cancelas, también se
              registrará la decisión sin emitir la receta.
            </p>
            {error && (
              <p className="medical-error" role="alert">
                {error}
              </p>
            )}
            <footer>
              <button
                type="button"
                className="secondary-button"
                onClick={cancelWithAlert}
                disabled={saving}
              >
                {saving ? "Registrando…" : "Cancelar prescripción"}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => preparePrescription(alertsToConfirm)}
                disabled={saving}
              >
                {saving ? "Guardando…" : "Confirmar y emitir"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

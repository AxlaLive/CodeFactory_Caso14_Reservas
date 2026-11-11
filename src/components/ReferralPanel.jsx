import { useEffect, useState } from "react";
import { professionalService, referralService } from "../api/clinicService";

function formatDate(value) {
  if (!value) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ReferralPanel({
  patientId,
  patientName,
  records,
  session,
  onOpenPatient,
  onSaved,
}) {
  const [professionals, setProfessionals] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState("");
  const [reason, setReason] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingSpecialists, setLoadingSpecialists] = useState(true);
  const referrals = records.referrals || [];
  const images = records.images || [];

  useEffect(() => {
    let active = true;
    professionalService
      .activeSpecialists(session.id)
      .then((items) => {
        if (active) setProfessionals(items);
      })
      .catch((caught) => {
        if (active)
          setError(
            caught.message || "No fue posible cargar los especialistas.",
          );
      })
      .finally(() => {
        if (active) setLoadingSpecialists(false);
      });
    return () => {
      active = false;
    };
  }, [session.id]);

  const createReferral = async (event) => {
    event.preventDefault();
    const specialist = professionals.find(
      (item) => item.id === selectedSpecialist,
    );
    if (!specialist) {
      setError("Selecciona un especialista para continuar.");
      return;
    }
    if (!reason.trim()) {
      setError("Describe brevemente el motivo clínico de la derivación.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const saved = await referralService.create(patientId, {
        patientId,
        patientName,
        specialistId: specialist.id,
        specialistName: specialist.name,
        specialty: specialist.specialty || specialist.role,
        referringProfessionalId: session.id,
        referringProfessionalName: session.name || session.username,
        reason: reason.trim(),
        clinicalNotes: clinicalNotes.trim(),
        imageIds: selectedImages,
        status: "pending",
      });
      onSaved(saved);
      setReason("");
      setClinicalNotes("");
      setSelectedImages([]);
      setSelectedSpecialist("");
      setNotice(
        `Derivación enviada a ${specialist.name}. Se notificó al especialista.`,
      );
      window.setTimeout(() => setNotice(""), 4000);
    } catch (caught) {
      setError(caught.message || "No fue posible guardar la derivación.");
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = {
    pending: "Pendiente",
    accepted: "Aceptada",
    declined: "No aceptada",
  };

  return (
    <div className="medical-panel referral-panel">
      <header className="medical-section-heading">
        <div>
          <span className="eyebrow">CONTINUIDAD DE ATENCIÓN</span>
          <h2>Derivar caso a especialista</h2>
          <p>
            Comparte el caso y los elementos clínicos elegidos. Al aceptar, el
            especialista podrá consultar el expediente completo del paciente.
          </p>
        </div>
      </header>
      <form className="referral-form" onSubmit={createReferral}>
        <div className="referral-form-intro">
          <span>↗</span>
          <div>
            <strong>Nueva derivación</strong>
            <small>
              La solicitud se crea pendiente y se enviará una notificación a la
              bandeja del profesional destino.
            </small>
          </div>
        </div>
        <label className="referral-field">
          Especialista destinatario
          <select
            value={selectedSpecialist}
            onChange={(event) => setSelectedSpecialist(event.target.value)}
            required
            disabled={loadingSpecialists}
          >
            <option value="">
              {loadingSpecialists
                ? "Cargando especialistas…"
                : "Seleccionar especialista"}
            </option>
            {professionals.map((professional) => (
              <option value={professional.id} key={professional.id}>
                {professional.name} ·{" "}
                {professional.specialty || professional.role || "Especialista"}
              </option>
            ))}
          </select>
        </label>
        {!loadingSpecialists && professionals.length === 0 && (
          <p className="referral-hint">
            No hay otros profesionales activos disponibles para derivación.
          </p>
        )}
        <label className="referral-field">
          Motivo de derivación
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows="3"
            placeholder="Ej. Evaluación endodóntica de pieza 16 por dolor persistente"
            required
          />
        </label>
        <label className="referral-field">
          Resumen e indicaciones para el especialista
          <textarea
            value={clinicalNotes}
            onChange={(event) => setClinicalNotes(event.target.value)}
            rows="4"
            placeholder="Antecedentes relevantes, hallazgos, tratamiento realizado y prioridad sugerida…"
          />
        </label>
        <fieldset className="referral-attachments">
          <legend>Imágenes clínicas para adjuntar</legend>
          {images.length === 0 ? (
            <p>
              No hay imágenes asociadas al expediente. Puedes adjuntarlas desde
              la pestaña «Imágenes asociadas».
            </p>
          ) : (
            <div className="referral-image-options">
              {images.map((image) => (
                <label key={image.id}>
                  <input
                    type="checkbox"
                    checked={selectedImages.includes(image.id)}
                    onChange={(event) =>
                      setSelectedImages((current) =>
                        event.target.checked
                          ? [...current, image.id]
                          : current.filter((id) => id !== image.id),
                      )
                    }
                  />
                  <span>
                    {image.dataUrl ? (
                      <img src={image.dataUrl} alt="" />
                    ) : (
                      <b>▧</b>
                    )}
                    <strong>{image.name}</strong>
                    <small>
                      {image.description || "Sin descripción"} · {image.date}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <div className="referral-sharing-note">
          <strong>Acceso clínico</strong>
          <span>
            La aceptación concede al especialista acceso al expediente clínico
            del paciente, no solo a las notas e imágenes seleccionadas. El
            backend aplicará los permisos definitivos.
          </span>
        </div>
        {error && (
          <p className="medical-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="referral-notice" role="status">
            ✓ {notice}
          </p>
        )}
        <button
          type="submit"
          className="primary-button referral-submit"
          disabled={saving || loadingSpecialists || professionals.length === 0}
        >
          {saving ? "Enviando…" : "Enviar derivación"}
        </button>
      </form>
      <section className="referral-history">
        <h3>Derivaciones de este expediente</h3>
        {referrals.length === 0 ? (
          <div className="medical-empty">
            <span>↗</span>
            <p>No hay casos derivados desde este expediente.</p>
          </div>
        ) : (
          [...referrals]
            .sort((a, b) =>
              (b.createdAt || "").localeCompare(a.createdAt || ""),
            )
            .map((referral) => (
              <article className="referral-history-item" key={referral.id}>
                <div className="referral-status-line">
                  <span
                    className={`referral-status referral-status-${referral.status}`}
                  >
                    {statusLabel[referral.status] || referral.status}
                  </span>
                  <time>{formatDate(referral.createdAt)}</time>
                </div>
                <div className="referral-history-content">
                  <strong>
                    {referral.specialistName} · {referral.specialty}
                  </strong>
                  <p>{referral.reason}</p>
                  {referral.clinicalNotes && (
                    <small>{referral.clinicalNotes}</small>
                  )}
                  {referral.imageIds?.length > 0 && (
                    <small>
                      {referral.imageIds.length} imagen(es) clínica(s)
                      adjunta(s)
                    </small>
                  )}
                  <small>Remitió: {referral.referringProfessionalName}</small>
                  {referral.status === "accepted" && (
                    <>
                      <small className="referral-accepted-info">
                        Aceptada por{" "}
                        {referral.acceptedByName || referral.specialistName} ·{" "}
                        {formatDate(referral.acceptedAt)} · acceso al expediente
                        concedido
                      </small>
                      <button
                        type="button"
                        className="referral-open-record"
                        onClick={() => onOpenPatient(referral.patientId)}
                      >
                        Abrir expediente compartido
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
        )}
      </section>
    </div>
  );
}

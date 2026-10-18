import { useEffect, useMemo, useState } from "react";
import {
  appointmentService,
  clinicalHistoryService,
  patientService,
} from "../api/clinicService";

const emptyPatient = { name: "", identification: "", phone: "", email: "" };
const emptyRecord = {
  citaId: "",
  evolucion: "",
  diagnostico: "",
  tratamiento: "",
  recomendaciones: "",
};

function todayKey() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function PatientManagement({ session }) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [patientFormOpen, setPatientFormOpen] = useState(false);
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [recordForm, setRecordForm] = useState(emptyRecord);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let current = true;
    Promise.all([patientService.list(), appointmentService.list()])
      .then(([nextPatients, nextAppointments]) => {
        if (!current) return;
        setPatients(nextPatients);
        setAppointments(nextAppointments);
      })
      .catch((loadError) => {
        if (current) setError(`No fue posible cargar pacientes: ${loadError.message}`);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId);
  const visiblePatients = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return patients
      .filter((patient) => patient.active)
      .filter((patient) =>
        !term
        || patient.name.toLocaleLowerCase("es").includes(term)
        || patient.identification.toLocaleLowerCase("es").includes(term),
      );
  }, [patients, search]);
  const patientAppointments = useMemo(() => {
    if (!selectedPatient) return [];
    return appointments
      .filter((appointment) => appointment.patientId === selectedPatient.identification)
      .sort((left, right) =>
        `${left.date} ${left.startTime}`.localeCompare(`${right.date} ${right.startTime}`),
      );
  }, [appointments, selectedPatient]);
  const upcomingAppointments = patientAppointments.filter(
    (appointment) => appointment.date >= todayKey() && appointment.status !== "cancelled",
  );
  const writableAppointments = patientAppointments.filter(
    (appointment) =>
      appointment.professionalId === session.id && appointment.status !== "cancelled",
  );
  const canWriteHistory = session.role === "professional";

  useEffect(() => {
    if (!selectedPatientId) {
      setHistory([]);
      return undefined;
    }
    let current = true;
    setHistoryLoading(true);
    setError("");
    clinicalHistoryService.list(selectedPatientId)
      .then((entries) => {
        if (current) setHistory(entries);
      })
      .catch((loadError) => {
        if (current) setError(`No fue posible cargar la historia clínica: ${loadError.message}`);
      })
      .finally(() => {
        if (current) setHistoryLoading(false);
      });
    return () => {
      current = false;
    };
  }, [selectedPatientId]);

  const createPatient = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const patient = await patientService.create(patientForm);
      setPatients((current) => [...current, patient]);
      setSelectedPatientId(patient.id);
      setPatientForm(emptyPatient);
      setPatientFormOpen(false);
      setNotice("Paciente registrado. La historia clínica está vacía hasta que se agregue una nota.");
    } catch (saveError) {
      setError(`No fue posible registrar al paciente: ${saveError.message}`);
    }
  };

  const createRecord = async (event) => {
    event.preventDefault();
    if (!selectedPatient) return;
    setError("");
    try {
      const created = await clinicalHistoryService.create(selectedPatient.id, {
        ...recordForm,
        citaId: Number(recordForm.citaId),
      });
      setHistory((current) => [created, ...current]);
      setRecordForm(emptyRecord);
      setNotice("Nota clínica guardada en la historia del paciente.");
    } catch (saveError) {
      setError(`No fue posible guardar la nota clínica: ${saveError.message}`);
    }
  };

  const formatDate = (value) => new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
  }).format(new Date(`${value}T12:00:00`));

  return (
    <section className="resource-page patient-management">
      <div className="resource-heading">
        <div>
          <span className="eyebrow">Atención clínica</span>
          <h2>Pacientes e historias clínicas</h2>
          <p>Consulta los datos del paciente, sus próximas citas y las notas de atención.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => setPatientFormOpen(true)}>
          ＋ Registrar paciente
        </button>
      </div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="notice-inline" role="status">{notice}</div>}
      {patientFormOpen && (
        <form className="patient-create-form" onSubmit={createPatient}>
          <h3>Datos del paciente</h3>
          <div className="form-grid">
            <label className="form-field">
              <span>Nombre completo</span>
              <input
                autoComplete="name"
                required
                value={patientForm.name}
                onChange={(event) => setPatientForm({ ...patientForm, name: event.target.value })}
              />
            </label>
            <label className="form-field">
              <span>Documento</span>
              <input
                required
                value={patientForm.identification}
                onChange={(event) => setPatientForm({ ...patientForm, identification: event.target.value })}
              />
            </label>
            <label className="form-field">
              <span>Teléfono</span>
              <input
                autoComplete="tel"
                value={patientForm.phone}
                onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })}
              />
            </label>
            <label className="form-field">
              <span>Correo electrónico</span>
              <input
                type="email"
                autoComplete="email"
                value={patientForm.email}
                onChange={(event) => setPatientForm({ ...patientForm, email: event.target.value })}
              />
            </label>
          </div>
          <div className="patient-form-actions">
            <button className="secondary-button" type="button" onClick={() => setPatientFormOpen(false)}>
              Cancelar
            </button>
            <button className="primary-button" type="submit">Guardar paciente</button>
          </div>
        </form>
      )}

      <div className="patient-workspace">
        <aside className="patient-directory" aria-label="Directorio de pacientes">
          <label className="form-field">
            <span>Buscar por nombre o documento</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          {loading ? <p className="empty-hint">Cargando pacientes…</p> : (
            <div className="patient-directory-list">
              {visiblePatients.length === 0 && (
                <p className="empty-hint">No se encontraron pacientes.</p>
              )}
              {visiblePatients.map((patient) => (
                <button
                  type="button"
                  className={selectedPatientId === patient.id ? "patient-directory-item selected" : "patient-directory-item"}
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                >
                  <strong>{patient.name}</strong>
                  <span>Documento: {patient.identification}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="patient-details">
          {!selectedPatient ? (
            <p className="empty-hint">Selecciona un paciente para consultar su información e historial.</p>
          ) : (
            <>
              <section className="patient-summary">
                <div>
                  <span className="eyebrow">Ficha del paciente</span>
                  <h3>{selectedPatient.name}</h3>
                </div>
                <dl className="patient-contact">
                  <div><dt>Documento</dt><dd>{selectedPatient.identification}</dd></div>
                  <div><dt>Teléfono</dt><dd>{selectedPatient.phone || "No registrado"}</dd></div>
                  <div><dt>Correo</dt><dd>{selectedPatient.email || "No registrado"}</dd></div>
                </dl>
              </section>

              <section className="patient-subsection">
                <h3>Próximas citas</h3>
                {upcomingAppointments.length === 0 ? (
                  <p className="empty-hint">No tiene próximas citas programadas.</p>
                ) : (
                  <ul className="patient-appointment-list">
                    {upcomingAppointments.map((appointment) => (
                      <li key={appointment.id}>
                        <strong>{formatDate(appointment.date)} · {appointment.startTime}</strong>
                        <span>{appointment.typeName} · {appointment.professionalName}</span>
                        <span>{appointment.spaceName}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="patient-subsection">
                <h3>Historia clínica</h3>
                <p className="field-hint">
                  Las notas quedan asociadas a la cita y al profesional que atendió. No se pueden borrar desde esta pantalla.
                </p>
                {historyLoading ? <p className="empty-hint">Cargando historia clínica…</p> : history.length === 0 ? (
                  <p className="empty-hint">Aún no hay notas clínicas para este paciente.</p>
                ) : (
                  <div className="clinical-history-list">
                    {history.map((entry) => (
                      <article className="clinical-history-entry" key={entry.id}>
                        <header>
                          <strong>{formatDate(entry.fechaCita)} · {entry.profesional}</strong>
                          <span>Registro del {new Intl.DateTimeFormat("es-CO", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(entry.creadoEn))}</span>
                        </header>
                        <dl>
                          <div><dt>Evolución</dt><dd>{entry.evolucion}</dd></div>
                          <div><dt>Diagnóstico</dt><dd>{entry.diagnostico}</dd></div>
                          <div><dt>Tratamiento</dt><dd>{entry.tratamiento}</dd></div>
                          <div><dt>Recomendaciones</dt><dd>{entry.recomendaciones}</dd></div>
                        </dl>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {canWriteHistory && (
                <form className="clinical-entry-form" onSubmit={createRecord}>
                  <h3>Registrar atención clínica</h3>
                  <label className="form-field">
                    <span>Cita atendida</span>
                    <select
                      required
                      value={recordForm.citaId}
                      onChange={(event) => setRecordForm({ ...recordForm, citaId: event.target.value })}
                    >
                      <option value="">Selecciona una cita propia del paciente</option>
                      {writableAppointments.map((appointment) => (
                        <option key={appointment.id} value={appointment.id}>
                          {formatDate(appointment.date)} · {appointment.startTime} · {appointment.typeName}
                        </option>
                      ))}
                    </select>
                    {writableAppointments.length === 0 && (
                      <small>Solo puedes registrar una nota para una cita asignada a tu cuenta.</small>
                    )}
                  </label>
                  {[
                    ["evolucion", "Notas de evolución"],
                    ["diagnostico", "Diagnóstico"],
                    ["tratamiento", "Tratamiento"],
                    ["recomendaciones", "Recomendaciones"],
                  ].map(([field, label]) => (
                    <label className="form-field" key={field}>
                      <span>{label}</span>
                      <textarea
                        required
                        maxLength={4000}
                        rows={3}
                        value={recordForm[field]}
                        onChange={(event) => setRecordForm({ ...recordForm, [field]: event.target.value })}
                      />
                    </label>
                  ))}
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={writableAppointments.length === 0}
                  >
                    Guardar nota clínica
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

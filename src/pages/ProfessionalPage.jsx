import { useEffect, useMemo, useState } from "react";
import AgendaWeekly from "../components/AgendaWeekly";
import AppointmentDetail from "../components/AppointmentDetail";
import BlockForm from "../components/BlockForm";
import MedicalRecordPage from "../components/MedicalRecordPage";
import PatientManagement from "../components/PatientManagement";
import ReferralsInbox from "../components/ReferralsInbox";
import { appointmentService, blockService, referralService } from "../api/clinicService";
import { getWeekDays, toDateKey } from "../utils/agenda";

export default function ProfessionalPage({
  session,
  weekDate,
  onChangeWeek,
  onLogout,
}) {
  const [view, setView] = useState("personal");
  const [appointments, setAppointments] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [medicalAppointment, setMedicalAppointment] = useState(null);
  const [medicalView, setMedicalView] = useState("record");
  const [blockFormOpen, setBlockFormOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const weekDays = useMemo(() => getWeekDays(weekDate), [weekDate]);

  useEffect(() => {
    Promise.all([appointmentService.list(), blockService.list()]).then(
      ([nextAppointments, nextBlocks]) => {
        setAppointments(nextAppointments);
        setBlocks(nextBlocks);
      },
    );
    referralService.pendingCount(session.id).then(setReferralCount).catch(() => {});
  }, [session.id]);

  const professionalId = session.id;
  const myAppointments = appointments.filter(
    (item) => item.professionalId === professionalId,
  );
  const myBlocks = blocks.filter(
    (item) => item.professionalId === professionalId,
  );

  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const registerBlock = async (data) => {
    const saved = await blockService.save({ ...data, professionalId });
    setBlocks((current) => [...current, saved]);
    setBlockFormOpen(false);
    notify("Espacio reservado en tu agenda.");
  };

  const removeBlock = async (block) => {
    if (!window.confirm("¿Liberar este espacio de tu agenda?")) return;
    await blockService.remove(block.id);
    setBlocks((current) => current.filter((item) => item.id !== block.id));
    notify("Espacio liberado correctamente.");
  };

  const displayName = session.name || session.username;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="admin-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
      <aside className={`admin-sidebar ${medicalAppointment ? "clinical-sidebar" : ""}`}>
        <div className="admin-brand">
          <span>✦</span>
          <strong>Dentia</strong>
          <small>{medicalAppointment ? "ATENCIÓN CLÍNICA" : "AGENDA PROFESIONAL"}</small>
        </div>
        <div className="admin-user">
          <b>{initials}</b>
          <div>
            <strong>{displayName}</strong>
            <span>{session.specialty || "Profesional"}</span>
          </div>
        </div>
        <nav aria-label="Navegación principal">
          {medicalAppointment ? (
            <>
              <span className="nav-title">Atención clínica</span>
              {[
                ["record", "▤", "Expediente clínico"],
                ["odontogram", "◉", "Odontograma"],
                ["plan", "▣", "Plan de tratamiento"],
              ].map(([id, icon, label]) => (
                <button
                  type="button"
                  key={id}
                  className={medicalView === id ? "active" : ""}
                  aria-current={medicalView === id ? "page" : undefined}
                  onClick={() => setMedicalView(id)}
                >
                  <span className="clinical-nav-icon">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
              <button
                type="button"
                className="clinical-return"
                onClick={() => setMedicalAppointment(null)}
              >
                ← <span>Volver a mi agenda</span>
              </button>
            </>
          ) : (
            <>
              <span className="nav-title">Mi agenda</span>
              <button
                type="button"
                className={view === "personal" ? "active" : ""}
                aria-label="Agenda personal"
                aria-current={view === "personal" ? "page" : undefined}
                onClick={() => setView("personal")}
              >
                ▦ <span>Agenda personal</span>
              </button>
              <button
                type="button"
                className={view === "general" ? "active" : ""}
                aria-label="Agenda general"
                aria-current={view === "general" ? "page" : undefined}
                onClick={() => setView("general")}
              >
                ◱ <span>Agenda general</span>
              </button>
              <button
                type="button"
                className={view === "referrals" ? "active" : ""}
                aria-label="Derivaciones recibidas"
                aria-current={view === "referrals" ? "page" : undefined}
                onClick={() => setView("referrals")}
              >
                ↙ <span>Derivaciones</span>{referralCount > 0 && <span className="referrals-nav-count">{referralCount}</span>}
              </button>
              <button
                type="button"
                className={view === "patients" ? "active" : ""}
                aria-label="Pacientes e historias clínicas"
                aria-current={view === "patients" ? "page" : undefined}
                onClick={() => setView("patients")}
              >
                ♧ <span>Pacientes</span>
              </button>
            </>
          )}
        </nav>
        <button className="logout" type="button" onClick={onLogout}>
          ↪ Cerrar sesion
        </button>
      </aside>

      <main className="admin-main" id="main-content" tabIndex="-1">
        <header className="admin-header">
          <div>
            <span className="eyebrow">
              Clinica Sonrisa · {medicalAppointment ? "Atención clínica" : session.specialty || "Profesional"}
            </span>
            <h1>
              {medicalAppointment
                ? medicalView === "odontogram"
                  ? `Odontograma · ${medicalAppointment.patientName}`
                  : medicalView === "plan"
                    ? `Plan de tratamiento · ${medicalAppointment.patientName}`
                    : `Expediente de ${medicalAppointment.patientName}`
                : view === "personal"
                  ? "Mi agenda personal"
                  : view === "general" ? "Agenda general" : view === "referrals" ? "Derivaciones recibidas" : "Pacientes"}
            </h1>
          </div>
          <div className="header-profile">
            <div className="profile-chip">
              <span className="profile-avatar">{initials}</span>
              <div>
                <strong>{displayName}</strong>
                <small>{session.specialty}</small>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {medicalAppointment ? (
            <MedicalRecordPage
              appointment={medicalAppointment}
              session={session}
              activeView={medicalView}
              onChangeView={setMedicalView}
              onBack={() => setMedicalAppointment(null)}
              onLogout={onLogout}
            />
          ) : view === "referrals" ? (
            <ReferralsInbox session={session} onOpenPatient={(appointment) => {
              setMedicalAppointment(appointment)
              setMedicalView("record")
            }} />
          ) : view === "patients" ? (
            <PatientManagement session={session} />
          ) : view === "personal" ? (
            <>
              <section className="agenda-intro">
                <div>
                  <p>
                    Consulta tus citas asignadas y reserva espacios para
                    descansos o tareas administrativas.
                  </p>
                  <div className="legend">
                    <span>
                      <i className="legend-scheduled" />
                      Cita
                    </span>
                    <span>
                      <i className="legend-buffer" />
                      Buffer
                    </span>
                    <span>
                      <i className="legend-block" />
                      Descanso / tarea
                    </span>
                  </div>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setBlockFormOpen(true)}
                >
                  ＋ Reservar espacio
                </button>
              </section>
              <AgendaWeekly
                weekDays={weekDays}
                appointments={myAppointments}
                blocks={myBlocks}
                onPreviousWeek={() =>
                  onChangeWeek(
                    new Date(
                      weekDate.getFullYear(),
                      weekDate.getMonth(),
                      weekDate.getDate() - 7,
                    ),
                  )
                }
                onNextWeek={() =>
                  onChangeWeek(
                    new Date(
                      weekDate.getFullYear(),
                      weekDate.getMonth(),
                      weekDate.getDate() + 7,
                    ),
                  )
                }
                onToday={() => onChangeWeek(new Date())}
                onSelectAppointment={setSelectedAppointment}
                readOnly
              />
              <section className="appointment-history">
                <span className="eyebrow">Espacios reservados</span>
                <h2>Descansos y tareas de la semana</h2>
                <div className="history-list">
                  {myBlocks.filter((item) =>
                    weekDays.some((day) => toDateKey(day) === item.date),
                  ).length === 0 && (
                    <p className="empty-hint">
                      Aún no has reservado espacios esta semana.
                    </p>
                  )}
                  {myBlocks
                    .filter((item) =>
                      weekDays.some((day) => toDateKey(day) === item.date),
                    )
                    .map((block) => (
                      <article className="history-item" key={block.id}>
                        <div>
                          <strong>
                            {block.label ||
                              (block.type === "break"
                                ? "Descanso"
                                : "Tarea administrativa")}
                          </strong>
                          <span>
                            {block.date} · {block.startTime} - {block.endTime}
                          </span>
                        </div>
                        <b>
                          {block.type === "break"
                            ? "Descanso"
                            : "Administrativa"}
                        </b>
                        <div className="history-actions">
                          <button onClick={() => removeBlock(block)}>
                            Liberar
                          </button>
                        </div>
                      </article>
                    ))}
                </div>
              </section>
            </>
          ) : (
            <AgendaWeekly
              weekDays={weekDays}
              appointments={appointments}
              blocks={blocks}
              showBlocks={false}
              onPreviousWeek={() =>
                onChangeWeek(
                  new Date(
                    weekDate.getFullYear(),
                    weekDate.getMonth(),
                    weekDate.getDate() - 7,
                  ),
                )
              }
              onNextWeek={() =>
                onChangeWeek(
                  new Date(
                    weekDate.getFullYear(),
                    weekDate.getMonth(),
                    weekDate.getDate() + 7,
                  ),
                )
              }
              onToday={() => onChangeWeek(new Date())}
              onSelectAppointment={setSelectedAppointment}
              readOnly
            />
          )}
        </div>
      </main>

      {selectedAppointment && (
        <AppointmentDetail
          appointment={selectedAppointment}
          readOnly
          onClose={() => setSelectedAppointment(null)}
          onEdit={() => {}}
          onReschedule={() => {}}
          onCancel={() => {}}
          canManageMedical={view === "personal"}
          onManageMedical={(appointment) => {
            setMedicalAppointment(appointment)
            setMedicalView("record")
            setSelectedAppointment(null)
          }}
        />
      )}
      {blockFormOpen && (
        <BlockForm
          weekDate={weekDate}
          onClose={() => setBlockFormOpen(false)}
          onSave={registerBlock}
        />
      )}
      {notice && <div className="notice">✓ {notice}</div>}
    </div>
  );
}

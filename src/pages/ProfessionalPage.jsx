import { useEffect, useMemo, useState } from "react";
import AgendaWeekly from "../components/AgendaWeekly";
import AppointmentDetail from "../components/AppointmentDetail";
import BlockForm from "../components/BlockForm";
import { appointmentService, blockService } from "../api/clinicService";
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
  const [blockFormOpen, setBlockFormOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const weekDays = useMemo(() => getWeekDays(weekDate), [weekDate]);

  useEffect(() => {
    Promise.all([appointmentService.list(), blockService.list()]).then(
      ([nextAppointments, nextBlocks]) => {
        setAppointments(nextAppointments);
        setBlocks(nextBlocks);
      },
    );
  }, []);

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
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>✦</span>
          <strong>Dentia</strong>
          <small>AGENDA PROFESIONAL</small>
        </div>
        <div className="admin-user">
          <b>{initials}</b>
          <div>
            <strong>{displayName}</strong>
            <span>{session.specialty || "Profesional"}</span>
          </div>
        </div>
        <nav>
          <span className="nav-title">Mi agenda</span>
          <button
            className={view === "personal" ? "active" : ""}
            onClick={() => setView("personal")}
          >
            ▦ <span>Agenda personal</span>
          </button>
          <button
            className={view === "general" ? "active" : ""}
            onClick={() => setView("general")}
          >
            ◱ <span>Agenda general</span>
          </button>
        </nav>
        <button className="logout" onClick={onLogout}>
          ↪ Cerrar sesion
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="eyebrow">
              Clinica Sonrisa · {session.specialty || "Profesional"}
            </span>
            <h1>
              {view === "personal" ? "Mi agenda personal" : "Agenda general"}
            </h1>
          </div>
          <div className="header-profile">
            <span className="header-status">
              <span /> Sistema operativo
            </span>
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
          {view === "personal" ? (
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

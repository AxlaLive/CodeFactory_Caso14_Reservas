import { useEffect, useMemo, useState } from "react";
import AgendaWeekly from "../components/AgendaWeekly";
import AppointmentDetail from "../components/AppointmentDetail";
import AppointmentForm from "../components/AppointmentForm";
import BlockForm from "../components/BlockForm";
import ProfessionalDetail from "../components/ProfessionalDetail";
import ProfessionalForm from "../components/ProfessionalForm";
import ResourceManager from "../components/ResourceManager";
import UserManagement from "../components/UserManagement";
import {
  appointmentService,
  blockService,
  professionalService,
  spaceService,
} from "../api/clinicService";
import { getWeekDays } from "../utils/agenda";

export default function AdminPage({
  session,
  weekDate,
  onChangeWeek,
  onLogout,
}) {
  const [view, setView] = useState("agenda");
  const [appointments, setAppointments] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [appointmentForm, setAppointmentForm] = useState(null);
  const [detailAppointment, setDetailAppointment] = useState(null);
  const [professionalForm, setProfessionalForm] = useState(false);
  const [blockFormOpen, setBlockFormOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [notice, setNotice] = useState("");
  const [pageError, setPageError] = useState("");
  const weekDays = useMemo(() => getWeekDays(weekDate), [weekDate]);

  useEffect(() => {
    Promise.all([
      appointmentService.list(),
      professionalService.list(),
      spaceService.list(),
      blockService.list(),
    ]).then(([nextAppointments, nextProfessionals, nextSpaces, nextBlocks]) => {
      setAppointments(nextAppointments);
      setProfessionals(nextProfessionals);
      setSpaces(nextSpaces);
      setBlocks(nextBlocks);
    }).catch((error) => setPageError(`No fue posible cargar la agenda: ${error.message}`));
  }, []);

  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const saveBlock = async (data) => {
    const saved = await blockService.save(data);
    setBlocks((current) => [...current, saved]);
    setBlockFormOpen(false);
    notify("Disponibilidad guardada en la agenda compartida.");
  };

  const bookableProfessionals = professionals.filter(
    (item) => item.active !== false && item.roleType !== "receptionist",
  );

  const saveAppointment = async (data) => {
    const saved = await appointmentService.save({
      ...data,
      id: data.id || `apt-${Date.now()}`,
    });
    setAppointments((current) =>
      current.some((item) => item.id === saved.id)
        ? current.map((item) => (item.id === saved.id ? saved : item))
        : [...current, saved],
    );
    setAppointmentForm(null);
    setDetailAppointment(null);
    notify(
      data.id && appointmentForm?.mode === "edit"
        ? "Cita actualizada correctamente."
        : "Cita agendada correctamente.",
    );
  };

  const cancelAppointment = async (appointment) => {
    if (!window.confirm(`¿Cancelar la cita de ${appointment.patientName}?`))
      return;
    await appointmentService.cancel(appointment.id);
    setAppointments((current) =>
      current.map((item) =>
        item.id === appointment.id ? { ...item, status: "cancelled" } : item,
      ),
    );
    setDetailAppointment(null);
    notify("Cita cancelada. La franja quedó disponible.");
  };

  const createProfessional = async (data) => {
    const item = await professionalService.create(data);
    setProfessionals((current) => [...current, item]);
    notify("Trabajador registrado correctamente.");
  };
  const toggleProfessional = async (professional) => {
    const updated = await professionalService.update(professional.id, {
      active: professional.active === false,
    });
    setProfessionals((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSelectedProfessional(updated);
    notify(
      updated.active
        ? "Trabajador marcado como activo."
        : "Trabajador marcado como inactivo.",
    );
  };
  const deleteProfessional = async (professional) => {
    if (
      !window.confirm(
        `¿Eliminar definitivamente a ${professional.name} del sistema?`,
      )
    )
      return;
    await professionalService.remove(professional.id);
    setProfessionals((current) =>
      current.filter((item) => item.id !== professional.id),
    );
    setSelectedProfessional(null);
    notify("Trabajador eliminado del sistema.");
  };

  const openCreateForDay = (dateKey) =>
    setAppointmentForm({
      mode: "create",
      value: { date: dateKey },
    });
  const openEdit = (appointment) =>
    setAppointmentForm({ mode: "edit", value: appointment });
  const openReschedule = (appointment) =>
    setAppointmentForm({ mode: "reschedule", value: appointment });

  const displayName = session.name || session.username || "Recepción";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const roleLabel =
    session.role === "admin" ? "Administrador" : "Recepcionista";
  const sectionTitle =
    view === "agenda"
      ? "Agenda general"
      : view === "professionals"
        ? "Equipo dentia"
        : view === "spaces"
          ? "Espacios físicos"
          : "Usuarios y accesos";

  return (
    <div className="admin-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>✦</span>
          <strong>Dentia</strong>
          <small>ADMINISTRACION CLINICA</small>
        </div>
        <div className="admin-user">
          <b>{initials}</b>
          <div>
            <strong>{displayName}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>
        <nav aria-label="Navegación principal">
          <span className="nav-title">Gestión clínica</span>
          <button
            type="button"
            className={view === "agenda" ? "active" : ""}
            aria-label="Agenda general"
            aria-current={view === "agenda" ? "page" : undefined}
            onClick={() => setView("agenda")}
          >
            ▦ <span>Agenda general</span>
          </button>
          <button
            type="button"
            className={view === "professionals" ? "active" : ""}
            aria-label="Equipo de trabajo"
            aria-current={view === "professionals" ? "page" : undefined}
            onClick={() => setView("professionals")}
          >
            ♧ <span>Equipo de trabajo</span>
          </button>
          <button
            type="button"
            className={view === "spaces" ? "active" : ""}
            aria-label="Espacios físicos"
            aria-current={view === "spaces" ? "page" : undefined}
            onClick={() => setView("spaces")}
          >
            ⌂ <span>Espacios físicos</span>
          </button>
          {session.role === "admin" && (
            <button
              type="button"
              className={view === "users" ? "active" : ""}
              aria-label="Usuarios y accesos"
              aria-current={view === "users" ? "page" : undefined}
              onClick={() => setView("users")}
            >
              ♙ <span>Usuarios y accesos</span>
            </button>
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
              Clinica Sonrisa · Panel administrativo
            </span>
            <h1>{sectionTitle}</h1>
          </div>
          <div className="header-profile">
            <div className="profile-chip">
              <span className="profile-avatar">{initials}</span>
              <div>
                <strong>{displayName}</strong>
                <small>{roleLabel}</small>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {pageError && <div className="form-error" role="alert">{pageError}</div>}
          {view === "agenda" && (
            <>
              <section className="agenda-intro">
                <div>
                  <p>
                    Gestiona la disponibilidad y las citas de todos los
                    profesionales de la clinica.
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
                  </div>
                </div>
                <button className="primary-button" onClick={() => setBlockFormOpen(true)} disabled={!professionals.length}>
                  ＋ Configurar disponibilidad
                </button>
              </section>
              <AgendaWeekly
                weekDays={weekDays}
                appointments={appointments}
                blocks={blocks}
                showBlocks
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
                onCreateForDay={openCreateForDay}
                onSelectAppointment={setDetailAppointment}
              />
            </>
          )}
          {blockFormOpen && (
            <BlockForm
              weekDate={weekDate}
              professionals={bookableProfessionals}
              onClose={() => setBlockFormOpen(false)}
              onSave={saveBlock}
            />
          )}

          {view === "professionals" && (
            <section className="resource-page">
              <div className="resource-heading">
                <div>
                  <span className="eyebrow">Administracion</span>
                  <h2>Equipo dentia</h2>
                  <p>
                    Administra las fichas del equipo. Para dar acceso al sistema,
                    crea una cuenta en «Usuarios y accesos».
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setProfessionalForm(true)}
                >
                  ＋ Registrar ficha profesional
                </button>
              </div>
              <div className="resource-list">
                {professionals.map((item) => (
                  <button
                    className="resource-item clickable"
                    key={item.id}
                    onClick={() => setSelectedProfessional(item)}
                  >
                    <div
                      className={
                        item.active === false
                          ? "resource-icon inactive"
                          : "resource-icon"
                      }
                    >
                      {item.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.role}</span>
                    </div>
                    <i className={item.active === false ? "inactive" : ""}>
                      {item.active === false ? "Inactivo" : "Activo"}
                    </i>
                  </button>
                ))}
              </div>
            </section>
          )}

          {view === "spaces" && (
            <ResourceManager
              title="Espacios físicos"
              description="Administra los consultorios y salas disponibles para las citas."
              items={spaces}
              fields={[
                {
                  name: "name",
                  label: "Nombre del espacio",
                  placeholder: "Ej. Consultorio general 2",
                },
                {
                  name: "type",
                  label: "Tipo de espacio",
                  placeholder: "Ej. Sala de cirugia oral",
                },
              ]}
              onCreate={async (data) => {
                const item = await spaceService.create(data);
                setSpaces((current) => [...current, item]);
                notify("Espacio registrado correctamente.");
              }}
            />
          )}
          {view === "users" && session.role === "admin" && <UserManagement />}
        </div>
      </main>

      {appointmentForm && (
        <AppointmentForm
          value={appointmentForm.value}
          mode={appointmentForm.mode}
          professionals={bookableProfessionals}
          spaces={spaces}
          appointments={appointments}
          blocks={blocks}
          onClose={() => setAppointmentForm(null)}
          onSave={saveAppointment}
        />
      )}
      {detailAppointment && !appointmentForm && (
        <AppointmentDetail
          appointment={detailAppointment}
          onClose={() => setDetailAppointment(null)}
          onEdit={openEdit}
          onReschedule={openReschedule}
          onCancel={cancelAppointment}
        />
      )}
      {professionalForm && (
        <ProfessionalForm
          onClose={() => setProfessionalForm(false)}
          onSave={createProfessional}
        />
      )}
      {selectedProfessional && (
        <ProfessionalDetail
          professional={selectedProfessional}
          onClose={() => setSelectedProfessional(null)}
          onToggleActive={toggleProfessional}
          onDelete={deleteProfessional}
        />
      )}
      {notice && <div className="notice">✓ {notice}</div>}
    </div>
  );
}

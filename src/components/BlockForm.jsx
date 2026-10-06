import { useState } from "react";
import { BLOCK_TYPES } from "../api/clinicService";
import { getTimeOptions, timeToMinutes, toDateKey } from "../utils/agenda";

export default function BlockForm({ weekDate, onClose, onSave }) {
  const [form, setForm] = useState({
    date: toDateKey(weekDate),
    type: "break",
    startTime: "12:00",
    endTime: "13:00",
    label: "",
  });
  const [error, setError] = useState("");
  const options = getTimeOptions(15);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const submit = (event) => {
    event.preventDefault();
    if (timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
      setError("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }
    const typeName =
      BLOCK_TYPES.find((item) => item.id === form.type)?.name || "";
    onSave({ ...form, label: form.label.trim() || typeName });
  };

  return (
    <div className="modal-layer" onMouseDown={onClose}>
      <form
        className="appointment-form block-form"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="form-header">
          <div>
            <span className="eyebrow">Agenda personal</span>
            <h2>Reservar espacio</h2>
          </div>
          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="field-hint">
          Los espacios reservados cuentan como ocupados y el recepcionista no
          podrá agendar citas sobre ellos.
        </p>
        {error && <div className="form-error">{error}</div>}

        <div className="form-grid">
          <label className="form-field">
            <span>Tipo de espacio</span>
            <select
              value={form.type}
              onChange={(event) => update("type", event.target.value)}
            >
              {BLOCK_TYPES.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Fecha</span>
            <input
              type="date"
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Hora de inicio</span>
            <select
              value={form.startTime}
              onChange={(event) => update("startTime", event.target.value)}
            >
              {options.map((time) => (
                <option value={time} key={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Hora de fin</span>
            <select
              value={form.endTime}
              onChange={(event) => update("endTime", event.target.value)}
            >
              {[...options, "20:00"]
                .filter((time, index, all) => all.indexOf(time) === index)
                .map((time) => (
                  <option value={time} key={time}>
                    {time}
                  </option>
                ))}
            </select>
          </label>
          <label className="form-field full-field">
            <span>Etiqueta (opcional)</span>
            <input
              value={form.label}
              onChange={(event) => update("label", event.target.value)}
              placeholder="Ej. Almuerzo, reunión, revisión de historias"
            />
          </label>
        </div>

        <footer className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" type="submit">
            Reservar espacio
          </button>
        </footer>
      </form>
    </div>
  );
}

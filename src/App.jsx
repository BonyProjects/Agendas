import { useEffect, useMemo, useRef, useState } from "react";

const createInitialTimerState = () => ({
  status: "idle", // idle | running | paused | finished
  index: -1,
  remaining: 0,
});

const formatMinutesLabel = (minutes) =>
  `${minutes} min${minutes !== 1 ? "s" : ""}`;

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

function App() {
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingGoal, setMeetingGoal] = useState("");
  const [agenda, setAgenda] = useState([]);
  const [newBlock, setNewBlock] = useState({
    topic: "",
    owner: "",
    duration: 5,
  });
  const [timer, setTimer] = useState(createInitialTimerState);
  const intervalRef = useRef(null);

  const totalMinutes = useMemo(
    () => agenda.reduce((sum, item) => sum + item.duration, 0),
    [agenda]
  );

  const currentBlock =
    timer.index >= 0 && timer.index < agenda.length
      ? agenda[timer.index]
      : null;

  const displayedSeconds =
    timer.status === "running" || timer.status === "paused"
      ? timer.remaining
      : timer.status === "finished"
      ? 0
      : currentBlock
      ? currentBlock.duration * 60
      : 0;

  const clearIntervalRef = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetTimer = () => {
    clearIntervalRef();
    setTimer(createInitialTimerState());
  };

  useEffect(() => {
    return () => {
      clearIntervalRef();
    };
  }, []);

  useEffect(() => {
    if (timer.status !== "running") {
      clearIntervalRef();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev.status !== "running") {
          return prev;
        }

        if (prev.remaining <= 1) {
          if (prev.index + 1 < agenda.length) {
            const next = agenda[prev.index + 1];
            return {
              status: "running",
              index: prev.index + 1,
              remaining: next.duration * 60,
            };
          }
          return {
            status: "finished",
            index: prev.index,
            remaining: 0,
          };
        }

        return {
          ...prev,
          remaining: prev.remaining - 1,
        };
      });
    }, 1000);

    return () => {
      clearIntervalRef();
    };
  }, [agenda, timer.status]);

  useEffect(() => {
    if (!agenda.length) {
      resetTimer();
      return;
    }

    if (timer.index >= agenda.length) {
      resetTimer();
    }
  }, [agenda, timer.index]);

  const handleAddBlock = (event) => {
    event.preventDefault();
    const durationNumber = Number(newBlock.duration);
    if (!newBlock.topic.trim() || !newBlock.owner.trim() || durationNumber <= 0) {
      return;
    }

    setAgenda((prev) => [
      ...prev,
      {
        topic: newBlock.topic.trim(),
        owner: newBlock.owner.trim(),
        duration: durationNumber,
      },
    ]);

    setNewBlock({
      topic: "",
      owner: "",
      duration: 5,
    });
  };

  const handleRemoveBlock = (index) => {
    setAgenda((prev) => prev.filter((_, idx) => idx !== index));
  };

  const startMeeting = () => {
    if (!agenda.length) return;
    setTimer({
      status: "running",
      index: 0,
      remaining: agenda[0].duration * 60,
    });
  };

  const pauseMeeting = () => {
    if (timer.status !== "running") return;
    clearIntervalRef();
    setTimer((prev) => ({ ...prev, status: "paused" }));
  };

  const resumeMeeting = () => {
    if (timer.status !== "paused") return;
    setTimer((prev) => ({ ...prev, status: "running" }));
  };

  const goToBlock = (index) => {
    if (index < 0 || index >= agenda.length) {
      resetTimer();
      return;
    }
    setTimer({
      status: "running",
      index,
      remaining: agenda[index].duration * 60,
    });
  };

  const nextBlock = () => {
    if (timer.index + 1 < agenda.length) {
      goToBlock(timer.index + 1);
    }
  };

  const prevBlock = () => {
    if (timer.index - 1 >= 0) {
      goToBlock(timer.index - 1);
    }
  };

  const resetMeeting = () => {
    resetTimer();
  };

  const isRunning = timer.status === "running";
  const isPaused = timer.status === "paused";
  const isFinished = timer.status === "finished";
  const hasAgenda = agenda.length > 0;

  return (
    <div className="page">
      <header className="hero">
        <div className="hero__eyebrow">Agenda inteligente</div>
        <h1 className="hero__title">Diseña reuniones memorables</h1>
        <p className="hero__subtitle">
          Orquesta cada minuto con precisión, comparte objetivos claros y dirige
          la conversación con un control que se siente invisible.
        </p>
        <div className="hero__meta">
          <div>
            <strong>{agenda.length}</strong>
            <span>Bloques activos</span>
          </div>
          <div>
            <strong>{formatMinutesLabel(totalMinutes)}</strong>
            <span>Duración total</span>
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="panel panel--form">
          <div className="panel__header">
            <h2 className="panel__title">Configura tu sesión</h2>
            <p className="panel__subtitle">
              Define la esencia y estructura antes de que comience la llamada.
            </p>
          </div>

          <form className="form-stack">
            <label className="field">
              <span className="field__label">Título de la reunión</span>
              <input
                value={meetingTitle}
                onChange={(event) => setMeetingTitle(event.target.value)}
                placeholder="Revisión semanal de producto"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Objetivo principal</span>
              <textarea
                value={meetingGoal}
                onChange={(event) => setMeetingGoal(event.target.value)}
                rows={3}
                placeholder="Alinear roadmap y priorizar tareas críticas"
              />
            </label>
          </form>

          <form className="panel__divider" onSubmit={handleAddBlock}>
            <div className="panel__header panel__header--compact">
              <h3 className="panel__title">Agregar bloque</h3>
              <p className="panel__subtitle">
                Diseña cada tema con un responsable y tiempo preciso.
              </p>
            </div>
            <div className="form-grid">
              <label className="field">
                <span className="field__label">Tema</span>
                <input
                  value={newBlock.topic}
                  onChange={(event) =>
                    setNewBlock((prev) => ({
                      ...prev,
                      topic: event.target.value,
                    }))
                  }
                  placeholder="Progreso del sprint"
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Responsable</span>
                <input
                  value={newBlock.owner}
                  onChange={(event) =>
                    setNewBlock((prev) => ({
                      ...prev,
                      owner: event.target.value,
                    }))
                  }
                  placeholder="Ana Martínez"
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Duración (min)</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={newBlock.duration}
                  onChange={(event) =>
                    setNewBlock((prev) => ({
                      ...prev,
                      duration: event.target.value,
                    }))
                  }
                  required
                />
              </label>
            </div>
            <div className="panel__actions">
              <button type="submit" className="btn btn--primary">
                Añadir bloque
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2 className="panel__title">Agenda</h2>
            <div className="panel__meta">
              <span className="pill pill--muted">
                {formatMinutesLabel(totalMinutes)} totales
              </span>
            </div>
          </div>

          {agenda.length === 0 ? (
            <div className="empty">
              <h3>Tu lienzo está listo</h3>
              <p>
                Añade tus primeros temas para generar una agenda impecable y
                mantener el ritmo durante la llamada.
              </p>
            </div>
          ) : (
            <div className="agenda-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tema</th>
                    <th>Responsable</th>
                    <th>Duración</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {agenda.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{item.topic}</td>
                      <td>{item.owner}</td>
                      <td>{formatMinutesLabel(item.duration)}</td>
                      <td className="agenda-actions">
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() => handleRemoveBlock(idx)}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel panel--focus">
          <div className="panel__header">
            <h2 className="panel__title">Modo reunión</h2>
            <p className="panel__subtitle">
              Visualiza el flujo en vivo y mantén a todos sincronizados.
            </p>
          </div>

          <div className="summary">
            <div>
              <span className="summary__label">Reunión</span>
              <strong className="summary__value">{meetingTitle || "—"}</strong>
            </div>
            <div>
              <span className="summary__label">Objetivo</span>
              <strong className="summary__value">{meetingGoal || "—"}</strong>
            </div>
            <div>
              <span className="summary__label">Bloques</span>
              <strong className="summary__value">{agenda.length}</strong>
            </div>
          </div>

          <div className="timer-display">
            <div className="timer-face">
              <span>{formatTime(displayedSeconds)}</span>
            </div>
            <div className="current-topic">
              <span className="pill">Bloque actual</span>
              <strong>
                {isFinished
                  ? "Agenda completada"
                  : currentBlock
                  ? currentBlock.topic
                  : "—"}
              </strong>
              <span className="current-topic__owner">
                {isFinished
                  ? "¡Buen trabajo!"
                  : currentBlock
                  ? `Responsable: ${currentBlock.owner}`
                  : "—"}
              </span>
            </div>
          </div>

          <div className="toolbar">
            <button
              type="button"
              className="btn btn--primary"
              onClick={startMeeting}
              disabled={!hasAgenda || isRunning}
            >
              Iniciar reunión
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={pauseMeeting}
              disabled={!isRunning}
            >
              Pausar
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={resumeMeeting}
              disabled={!isPaused}
            >
              Reanudar
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={nextBlock}
              disabled={!hasAgenda || timer.index + 1 >= agenda.length}
            >
              Siguiente
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={prevBlock}
              disabled={!hasAgenda || timer.index <= 0}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={resetMeeting}
              disabled={!hasAgenda && timer.status === "idle"}
            >
              Reiniciar
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;



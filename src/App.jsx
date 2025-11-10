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
    <main>
      <section>
        <h1>Agenda para Videollamadas</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Define objetivos, arma tu agenda y gestiona el tiempo en vivo.
        </p>
        <form style={{ display: "grid", gap: "16px" }}>
          <label>
            Título de la reunión
            <input
              value={meetingTitle}
              onChange={(event) => setMeetingTitle(event.target.value)}
              placeholder="Revisión semanal de producto"
              required
            />
          </label>
          <label>
            Objetivo principal
            <textarea
              value={meetingGoal}
              onChange={(event) => setMeetingGoal(event.target.value)}
              rows={3}
              placeholder="Alinear roadmap y priorizar tareas críticas"
            />
          </label>
        </form>

        <form
          onSubmit={handleAddBlock}
          style={{ display: "grid", gap: "12px" }}
        >
          <h2 style={{ fontSize: "18px" }}>Agregar bloque de agenda</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            <label>
              Tema
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
            <label>
              Responsable
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
            <label>
              Duración (min)
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
          <button type="submit" className="primary">
            Añadir bloque
          </button>
        </form>
      </section>

      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: "20px" }}>Agenda</h2>
          <span className="pill">{formatMinutesLabel(totalMinutes)} totales</span>
        </div>
        {agenda.length === 0 ? (
          <div className="empty">Añade tus primeros temas para generar la agenda.</div>
        ) : (
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
                      className="neutral"
                      onClick={() => handleRemoveBlock(idx)}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "20px" }}>Modo reunión</h2>
        <div className="summary">
          <div>
            <strong>Reunión:</strong> {meetingTitle || "—"}
          </div>
          <div>
            <strong>Objetivo:</strong> {meetingGoal || "—"}
          </div>
          <div>
            <strong>Bloques:</strong> {agenda.length}
          </div>
        </div>

        <div className="timer-display">
          <div className="timer-face">{formatTime(displayedSeconds)}</div>
          <div className="current-topic">
            <span className="pill">Bloque actual</span>
            <strong>
              {isFinished
                ? "Agenda completada"
                : currentBlock
                ? currentBlock.topic
                : "—"}
            </strong>
            <span style={{ color: "var(--muted)" }}>
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
            className="primary"
            onClick={startMeeting}
            disabled={!hasAgenda || isRunning}
          >
            Iniciar reunión
          </button>
          <button
            type="button"
            className="secondary"
            onClick={pauseMeeting}
            disabled={!isRunning}
          >
            Pausar
          </button>
          <button
            type="button"
            className="secondary"
            onClick={resumeMeeting}
            disabled={!isPaused}
          >
            Reanudar
          </button>
          <button
            type="button"
            className="neutral"
            onClick={nextBlock}
            disabled={!hasAgenda || timer.index + 1 >= agenda.length}
          >
            Siguiente
          </button>
          <button
            type="button"
            className="neutral"
            onClick={prevBlock}
            disabled={!hasAgenda || timer.index <= 0}
          >
            Anterior
          </button>
          <button
            type="button"
            className="neutral"
            onClick={resetMeeting}
            disabled={!hasAgenda && timer.status === "idle"}
          >
            Reiniciar
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;



import { Header } from "./components/Header"
import { CardComponents } from "./components/CardComponents"
import { initialColumns } from "./components/data"
import { useEffect, useState } from "react"

const COLUMNS_STORAGE_KEY = "task-management-columns";

const loadColumns = () => {
  try {
    const savedColumns = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (!savedColumns) return initialColumns;

    const parsedColumns = JSON.parse(savedColumns);
    if (
      Array.isArray(parsedColumns) &&
      parsedColumns.every((column) =>
        column && typeof column.id === "string" &&
        typeof column.title === "string" &&
        Array.isArray(column.tasks)
      )
    ) {
      return parsedColumns;
    }
  } catch {

  }

  return initialColumns;
};

const columnColors = [
  { name: "Grey", value: "#E2E8F0;" },
  { name: "Slate", value: "#F1F5F9" },
  { name: "Rose", value: "#FFE4E6" },
  { name: "Amber", value: "#FEF3C7" },
  { name: "Lime", value: "#ECFCCB" },
  { name: "Teal", value: "#CCFBF1" },
  { name: "Violet", value: "#EDE9FE" },
  { name: "Pink", value: "#FCE7F3" },
];

function App() {
  const [columns, setColumns] = useState(loadColumns);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnColor, setNewColumnColor] = useState(columnColors[0].value);

  useEffect(() => {
    try {
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(columns));
    } catch {
      // The board remains usable if browser storage is unavailable or full.
    }
  }, [columns]);

  const addColumn = () => {
    const title = newColumnTitle.trim();
    if (!title) return;

    const newColumn = {
      id: crypto.randomUUID(),
      title,
      color: newColumnColor,
      tasks: [],
    };

    setColumns((prevColumns) => [...prevColumns, newColumn]);
    setNewColumnTitle("");
    setNewColumnColor(columnColors[0].value);
    setIsColumnModalOpen(false);
  };
  return (
    <div className="main">
      <Header onAddColumn={() => setIsColumnModalOpen(true)} className="fixed"/>
      <CardComponents
       columns={columns}
       setColumns={setColumns}
      />
      {isColumnModalOpen && (
        <div
          className="column-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsColumnModalOpen(false);
          }}
        >
          <form
            className="column-modal"
            onSubmit={(event) => {
              event.preventDefault();
              addColumn();
            }}
          >
            <h2>Create a column</h2>
            <label htmlFor="column-title">Column header</label>
            <input
              id="column-title"
              type="text"
              autoFocus
              maxLength={40}
              placeholder="e.g. Backlog"
              value={newColumnTitle}
              onChange={(event) => setNewColumnTitle(event.target.value)}
              required
            />
            <fieldset className="column-color-picker">
              <legend>Choose a color</legend>
              <div className="column-color-options">
                {columnColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`column-color-swatch ${newColumnColor === color.value ? "selected" : ""}`}
                    style={{ "--swatch-color": color.value }}
                    aria-label={`${color.name} color`}
                    aria-pressed={newColumnColor === color.value}
                    onClick={() => setNewColumnColor(color.value)}
                  />
                ))}
              </div>
            </fieldset>
            <div className="column-modal-actions">
              <button type="button" className="cancel-column" onClick={() => setIsColumnModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="create-column" disabled={!newColumnTitle.trim()}>
                Create column
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default App

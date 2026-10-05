import { useState } from "react";
import { FaEdit, FaTrash} from "react-icons/fa";


export const CardComponents = ({columns, setColumns}) => {
  const [openModalId, setOpenModalId] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [dropTarget, setDropTarget] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const handleTaskDragStart = (event, columnId, taskId) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify({ columnId, taskId }));
    event.currentTarget.classList.add("is-dragging");
  };

  const handleTaskDragOver = (event, columnId, taskId, taskIndex) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const bounds = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    setDropTarget({ columnId, taskId, taskIndex, position });
  };

  const moveTask = (sourceColumnId, taskId, targetColumnId, targetIndex) => {
    setColumns((previousColumns) => {
      const nextColumns = previousColumns.map((column) => ({
        ...column,
        tasks: [...column.tasks],
      }));
      const sourceColumn = nextColumns.find((column) => column.id === sourceColumnId);
      const targetColumn = nextColumns.find((column) => column.id === targetColumnId);
      const sourceIndex = sourceColumn?.tasks.findIndex((task) => task.id === taskId);

      if (!sourceColumn || !targetColumn || sourceIndex < 0) return previousColumns;

      const [task] = sourceColumn.tasks.splice(sourceIndex, 1);
      const adjustedIndex = sourceColumnId === targetColumnId && sourceIndex < targetIndex
        ? targetIndex - 1
        : targetIndex;
      const safeIndex = Math.max(0, Math.min(adjustedIndex, targetColumn.tasks.length));
      targetColumn.tasks.splice(safeIndex, 0, task);
      return nextColumns;
    });
  };

  const handleTaskDrop = (event, targetColumnId, targetIndex) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const { columnId: sourceColumnId, taskId } = JSON.parse(
        event.dataTransfer.getData("application/json")
      );
      const bounds = event.currentTarget.getBoundingClientRect();
      const insertionIndex = event.clientY < bounds.top + bounds.height / 2
        ? targetIndex
        : targetIndex + 1;
      moveTask(sourceColumnId, taskId, targetColumnId, insertionIndex);
    } catch {
      // Ignore drops that do not contain a task from this board.
    }

    setDropTarget(null);
  };

  const handleColumnDrop = (event, targetColumnId) => {
    event.preventDefault();
    if (event.target !== event.currentTarget) return;

    try {
      const { columnId: sourceColumnId, taskId } = JSON.parse(
        event.dataTransfer.getData("application/json")
      );
      const targetColumn = columns.find((column) => column.id === targetColumnId);
      moveTask(sourceColumnId, taskId, targetColumnId, targetColumn?.tasks.length ?? 0);
    } catch {
      // Ignore drops that do not contain a task from this board.
    }

    setDropTarget(null);
  };

  const handleAddColumn = () => {
  const columnTitle = prompt("Enter column name:");

  if (!columnTitle?.trim()) return;

  const newColumn = {
    id: crypto.randomUUID(),
    title: columnTitle.trim(),
    tasks: [],
  };

  setColumns((prevColumns) => [
    ...prevColumns,
    newColumn,
  ]);
};

  const addTask = (columnId) => {
    const title = newTaskTitle.trim();

    if (!title) return false;

    const newTask = {
      id: crypto.randomUUID(),
      title,
      createdAt: new Date().toISOString(),
    };
    setNewTaskTitle("");

    setColumns((prevColumns) =>
      prevColumns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              tasks: [...column.tasks, newTask],
            }
          : column
      )
    );
    return true;
  };

  const handleDelete = (columnId, taskId) => {
    setColumns((prevColumns) =>
      prevColumns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              tasks: column.tasks.filter((task) => task.id !== taskId),
            }
          : column
      )
    );
  };

  const saveTaskEdit = (event) => {
    event.preventDefault();
    const title = editingTask?.title.trim();
    if (!title) return;

    setColumns((previousColumns) =>
      previousColumns.map((column) =>
        column.id === editingTask.columnId
          ? {
              ...column,
              tasks: column.tasks.map((task) =>
                task.id === editingTask.taskId ? { ...task, title } : task
              ),
            }
          : column
      )
    );
    setEditingTask(null);
  };

  const deleteColumn = (columnId) => {
  setColumns((prevColumns) =>
    prevColumns.filter((column) => column.id !== columnId)
  );
};

  const showModal = (columnId) => {
    setOpenModalId((currentModalId) =>
      currentModalId === columnId ? null : columnId
    );
  };

  return (
    <div className="main-card-div">
      {columns.map((column) => (
        <div
          className="card-div"
          key={column.id}
        >
          <div
            className="column-header"
            style={{ backgroundColor: column.color || "#E2E8F0" }}
          >
             <h1>{column.title}</h1>
             <div className="dots">
                <button>{column.tasks.length}</button>
                <div onClick={()=> deleteColumn(column.id)} className="delete-btn"><FaTrash className="column-del-icon"/></div>
             </div>
          </div>
          <div
            className="card-list"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleColumnDrop(event, column.id)}
          >
            {column.tasks.map((task, taskIndex) => (
              <div
                className={`container ${dropTarget?.columnId === column.id && dropTarget.taskId === task.id ? `drop-${dropTarget.position}` : ""}`}
                key={task.id}
                draggable
                onDragStart={(event) => handleTaskDragStart(event, column.id, task.id)}
                onDragEnd={(event) => {
                  event.currentTarget.classList.remove("is-dragging");
                  setDropTarget(null);
                }}
                onDragOver={(event) => handleTaskDragOver(event, column.id, task.id, taskIndex)}
                onDrop={(event) => handleTaskDrop(event, column.id, taskIndex)}
              >
                <p>{task.title}</p>
                <div className="icons-div">
                  {task.createdAt && !Number.isNaN(Date.parse(task.createdAt)) ? (
                    <small>
                      <time dateTime={task.createdAt} className="time">
                        {new Date(task.createdAt).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                    </small>
                  ) : (
                    <small>Date and time unavailable</small>
                  )}
                  <div className="inner-icons">
                    <button
                      className="edit"
                      type="button"
                      aria-label={`Edit ${task.title}`}
                      onClick={() => setEditingTask({
                        columnId: column.id,
                        taskId: task.id,
                        title: task.title,
                      })}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="trash"
                      type="button"
                      aria-label="Delete task"
                      onClick={() => handleDelete(column.id, task.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="button">
            <button onClick={() => showModal(column.id)}>+ Add Task</button>
          </div>
          <div className={`task-modal ${openModalId === column.id ? "is-open" : ""}`}>
            <div className="input-div">
                <textarea
                  rows={3}
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  aria-label={`Task name for ${column.title}`}
                />
            </div>
            <div className="btn-div">
                <button onClick={() => setOpenModalId(null)} className="cancel">Cancel</button>
                <button onClick={() => {
                  if (addTask(column.id)) setOpenModalId(null);
                }}>
                  Save
                </button>
            </div>
          </div>
        </div>
      ))}
      {editingTask && (
        <div
          className="task-edit-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingTask(null);
          }}
        >
          <form className="task-edit-modal" onSubmit={saveTaskEdit}>
            <h2>Edit task</h2>
            <label htmlFor="edit-task-title">Task details</label>
            <textarea
              id="edit-task-title"
              rows={4}
              maxLength={500}
              autoFocus
              value={editingTask.title}
              onChange={(event) =>
                setEditingTask((currentTask) => ({
                  ...currentTask,
                  title: event.target.value,
                }))
              }
              required
            />
            <div className="column-modal-actions">
              <button type="button" onClick={() => setEditingTask(null)}>
                Cancel
              </button>
              <button className="create-column" type="submit" disabled={!editingTask.title.trim()}>
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
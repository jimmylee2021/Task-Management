import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaEdit, FaEllipsisV, FaTrash } from "react-icons/fa";


export const CardComponents = ({columns, setColumns}) => {
  const [openModalId, setOpenModalId] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [dropTarget, setDropTarget] = useState(null);
  const [columnDropTarget, setColumnDropTarget] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [openColumnMenuId, setOpenColumnMenuId] = useState(null);
  const columnsContainerRef = useRef(null);
  const columnPositionsBeforeReorder = useRef(null);

  useEffect(() => {
    if (!openColumnMenuId) return undefined;

    const closeMenuOnOutsideClick = (event) => {
      if (!event.target.closest(".column-header-actions")) setOpenColumnMenuId(null);
    };
    const closeMenuOnEscape = (event) => {
      if (event.key === "Escape") setOpenColumnMenuId(null);
    };

    document.addEventListener("pointerdown", closeMenuOnOutsideClick);
    document.addEventListener("keydown", closeMenuOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenuOnOutsideClick);
      document.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, [openColumnMenuId]);

  useLayoutEffect(() => {
    const previousPositions = columnPositionsBeforeReorder.current;
    if (!previousPositions) return undefined;

    const columnsToAnimate = Array.from(
      columnsContainerRef.current?.querySelectorAll("[data-column-id]") ?? []
    );
    columnsToAnimate.forEach((element) => {
      const previousPosition = previousPositions.get(element.dataset.columnId);
      if (!previousPosition) return;

      const currentPosition = element.getBoundingClientRect();
      const deltaX = previousPosition.left - currentPosition.left;
      if (deltaX === 0) return;

      element.style.transition = "none";
      element.style.transform = `translateX(${deltaX}px)`;
      element.getBoundingClientRect();
      requestAnimationFrame(() => {
        element.style.transition = "";
        element.style.transform = "";
      });
    });

    columnPositionsBeforeReorder.current = null;
    return undefined;
  }, [columns]);

  const columnDragType = "application/x-task-management-column";

  const handleColumnDragStart = (event, columnId) => {
    if (event.target.closest("button, .delete-btn, .container, textarea, input")) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(columnDragType, columnId);
    event.currentTarget.classList.add("is-column-dragging");

    const dragPreview = event.currentTarget.cloneNode(true);
    const bounds = event.currentTarget.getBoundingClientRect();
    dragPreview.classList.add("column-drag-preview");
    dragPreview.style.width = `${bounds.width}px`;
    dragPreview.style.height = `${bounds.height}px`;
    dragPreview.style.position = "fixed";
    dragPreview.style.top = "-10000px";
    dragPreview.style.left = "-10000px";
    document.body.appendChild(dragPreview);
    event.dataTransfer.setDragImage(
      dragPreview,
      event.nativeEvent.offsetX,
      event.nativeEvent.offsetY
    );
    window.setTimeout(() => dragPreview.remove(), 0);
  };

  const handleColumnDragOver = (event, targetColumnId) => {
    if (!Array.from(event.dataTransfer.types).includes(columnDragType)) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = event.clientX < bounds.left + bounds.width / 2 ? "before" : "after";
    setColumnDropTarget({ columnId: targetColumnId, position });
  };

  const handleColumnReorderDrop = (event, targetColumnId) => {
    if (!Array.from(event.dataTransfer.types).includes(columnDragType)) return;

    event.preventDefault();
    event.stopPropagation();
    const sourceColumnId = event.dataTransfer.getData(columnDragType);
    const targetBounds = event.currentTarget.getBoundingClientRect();
    const position = event.clientX < targetBounds.left + targetBounds.width / 2 ? "before" : "after";
    const sourceIndex = columns.findIndex((column) => column.id === sourceColumnId);
    const targetIndex = columns.findIndex((column) => column.id === targetColumnId);

    if (sourceIndex >= 0 && targetIndex >= 0 && sourceIndex !== targetIndex) {
      columnPositionsBeforeReorder.current = new Map(
        Array.from(columnsContainerRef.current?.querySelectorAll("[data-column-id]") ?? [])
          .map((element) => [element.dataset.columnId, element.getBoundingClientRect()])
      );
    }

    setColumns((previousColumns) => {
      const sourceIndex = previousColumns.findIndex((column) => column.id === sourceColumnId);
      const targetIndex = previousColumns.findIndex((column) => column.id === targetColumnId);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return previousColumns;

      const nextColumns = [...previousColumns];
      const [sourceColumn] = nextColumns.splice(sourceIndex, 1);
      const insertionIndex = targetIndex + (position === "after" ? 1 : 0) - (sourceIndex < targetIndex ? 1 : 0);
      nextColumns.splice(insertionIndex, 0, sourceColumn);
      return nextColumns;
    });
    setColumnDropTarget(null);
  };

  const handleTaskDragStart = (event, columnId, taskId) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify({ columnId, taskId }));
    event.currentTarget.classList.add("is-dragging");
  };

  const handleTaskDragOver = (event, columnId, taskId, taskIndex) => {
    if (!Array.from(event.dataTransfer.types).includes("application/json")) return;
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
    if (Array.from(event.dataTransfer.types).includes(columnDragType)) return;
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

  const handleTaskColumnDrop = (event, targetColumnId) => {
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

  const saveColumnEdit = (event) => {
    event.preventDefault();
    const title = editingColumn?.title.trim();
    if (!title) return;

    setColumns((previousColumns) =>
      previousColumns.map((column) =>
        column.id === editingColumn.id ? { ...column, title } : column
      )
    );
    setEditingColumn(null);
  };

  const deleteColumn = (column) => {
    setColumns((previousColumns) =>
      previousColumns.filter((currentColumn) => currentColumn.id !== column.id)
    );
    setOpenColumnMenuId(null);
  };

  const showModal = (columnId) => {
    setOpenModalId((currentModalId) =>
      currentModalId === columnId ? null : columnId
    );
  };

  return (
    <div className="main-card-div" ref={columnsContainerRef}>
      {columns.map((column) => (
        <div
          className={`card-div ${columnDropTarget?.columnId === column.id ? `column-drop-${columnDropTarget.position}` : ""}`}
          key={column.id}
          data-column-id={column.id}
          draggable
          onDragStart={(event) => handleColumnDragStart(event, column.id)}
          onDragOver={(event) => handleColumnDragOver(event, column.id)}
          onDrop={(event) => handleColumnReorderDrop(event, column.id)}
          onDragEnd={(event) => {
            event.currentTarget.classList.remove("is-column-dragging");
            setColumnDropTarget(null);
          }}
        >
          <div
            className="column-header"
            style={{ backgroundColor: column.color || "#E2E8F0" }}
          >
             <h1>{column.title}</h1>
             <div className="column-header-actions">
                <span className="column-task-count">{column.tasks.length}</span>
                <button
                  className="column-menu-trigger"
                  type="button"
                  aria-label={`Column actions for ${column.title}`}
                  aria-haspopup="menu"
                  aria-expanded={openColumnMenuId === column.id}
                  onClick={() => setOpenColumnMenuId((currentId) =>
                    currentId === column.id ? null : column.id
                  )}
                >
                  <FaEllipsisV aria-hidden="true" />
                </button>
                {openColumnMenuId === column.id && (
                  <div className="column-menu-dropdown" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      className="column-menu-item"
                      onClick={() => {
                        setEditingColumn({ id: column.id, title: column.title });
                        setOpenColumnMenuId(null);
                      }}
                    >
                      <FaEdit aria-hidden="true" /> Edit name
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="column-menu-item delete-column-item"
                      onClick={() => deleteColumn(column)}
                    >
                      <FaTrash aria-hidden="true" /> Delete column
                    </button>
                  </div>
                )}
             </div>
          </div>
          <div
            className="card-list"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleTaskColumnDrop(event, column.id)}
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
      {editingColumn && (
        <div
          className="column-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditingColumn(null);
          }}
        >
          <form className="column-modal" onSubmit={saveColumnEdit}>
            <h2>Edit column name</h2>
            <label htmlFor="edit-column-title">Column header</label>
            <input
              id="edit-column-title"
              type="text"
              autoFocus
              maxLength={40}
              value={editingColumn.title}
              onChange={(event) =>
                setEditingColumn((currentColumn) => ({
                  ...currentColumn,
                  title: event.target.value,
                }))
              }
              required
            />
            <div className="column-modal-actions">
              <button type="button" onClick={() => setEditingColumn(null)}>
                Cancel
              </button>
              <button className="create-column" type="submit" disabled={!editingColumn.title.trim()}>
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
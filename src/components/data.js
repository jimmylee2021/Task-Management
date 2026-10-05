const demoCreatedAt = new Date().toISOString();

export const initialColumns = [
    {
      id: "column-1",
      title: "To Do",
      tasks: [
        { id: "1", title: "Design homepage", createdAt: demoCreatedAt },
        { id: "2", title: "Design homepage", createdAt: demoCreatedAt },
        { id: "3", title: "Design homepage", createdAt: demoCreatedAt },
      ],
    },
    {
      id: "column-2",
      title: "In Progress",
      tasks: [
        { id: "4", title: "Hit the gymn", createdAt: demoCreatedAt },
        { id: "5", title: "Play Basketball", createdAt: demoCreatedAt },
        { id: "6", title: "Play Basketball", createdAt: demoCreatedAt },
      ],
    },
    {
      id: "column-3",
      title: "Done",
      tasks: [
        { id: "7", title: "Hit the gymn", createdAt: demoCreatedAt },
        { id: "8", title: "Play Basketball", createdAt: demoCreatedAt },
        { id: "9", title: "Play Basketball", createdAt: demoCreatedAt },
      ],
    },
  ];
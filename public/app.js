const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("dueDate");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

async function loadTasks() {
  const res = await fetch("/api/tasks");
  const tasks = await res.json();

  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";

    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;

    if (task.completed) {
      title.classList.add("completed");
    }

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = `Priority: ${task.priority || "Medium"} | Due: ${task.dueDate || "None"}`;

    info.appendChild(title);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const completeBtn = document.createElement("button");
    completeBtn.className = "complete-btn";
    completeBtn.textContent = task.completed ? "Undo" : "Complete";
    completeBtn.onclick = async () => {
      await fetch(`/api/tasks/${task.id}`, { method: "PUT" });
      loadTasks();
    };

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";
    editBtn.onclick = async () => {
      const newTitle = prompt("Edit task title:", task.title);
      if (newTitle === null) return;

      const trimmedTitle = newTitle.trim();
      if (!trimmedTitle) {
        alert("Task title cannot be empty.");
        return;
      }

      const newPriority = prompt(
        "Edit priority (Low, Medium, High):",
        task.priority || "Medium"
      );
      if (newPriority === null) return;

      const validPriorities = ["Low", "Medium", "High"];
      const formattedPriority =
        newPriority.charAt(0).toUpperCase() + newPriority.slice(1).toLowerCase();

      if (!validPriorities.includes(formattedPriority)) {
        alert("Priority must be Low, Medium, or High.");
        return;
      }

      const newDueDate = prompt(
        "Edit due date (YYYY-MM-DD) or leave empty:",
        task.dueDate || ""
      );
      if (newDueDate === null) return;

      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          priority: formattedPriority,
          dueDate: newDueDate.trim() || null,
        }),
      });

      loadTasks();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = async () => {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      loadTasks();
    };

    actions.appendChild(completeBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(info);
    li.appendChild(actions);

    taskList.appendChild(li);
  });
}

addTaskBtn.addEventListener("click", async () => {
  const title = taskInput.value.trim();

  if (!title) {
    alert("Please enter a task");
    return;
  }

  await fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      priority: priorityInput.value,
      dueDate: dueDateInput.value || null,
    }),
  });

  taskInput.value = "";
  priorityInput.value = "Medium";
  dueDateInput.value = "";
  loadTasks();
});

taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTaskBtn.click();
  }
});

loadTasks();
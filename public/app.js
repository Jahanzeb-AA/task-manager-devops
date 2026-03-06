const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

async function loadTasks() {
  const res = await fetch("/api/tasks");
  const tasks = await res.json();

  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    if (task.completed) {
      title.classList.add("completed");
    }

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
    editBtn.textContent = "Edit";
    editBtn.onclick = async () => {
      const newTitle = prompt("Edit task title:", task.title);

      if (newTitle === null) {
        return;
      }

      const trimmedTitle = newTitle.trim();

      if (!trimmedTitle) {
        alert("Task title cannot be empty.");
        return;
      }

      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: trimmedTitle }),
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

    li.appendChild(title);
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
    body: JSON.stringify({ title }),
  });

  taskInput.value = "";
  loadTasks();
});

taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTaskBtn.click();
  }
});

loadTasks();
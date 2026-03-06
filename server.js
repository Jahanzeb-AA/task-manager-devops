const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database("./tasks.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0
    )
  `);

  db.all("PRAGMA table_info(tasks)", [], (err, columns) => {
    if (err) {
      console.error("Error reading table info:", err.message);
      return;
    }

    const columnNames = columns.map((col) => col.name);

    if (!columnNames.includes("priority")) {
      db.run(
        "ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'Medium'",
        (alterErr) => {
          if (alterErr) {
            console.error("Error adding priority column:", alterErr.message);
          } else {
            console.log("Added priority column.");
          }
        }
      );
    }

    if (!columnNames.includes("dueDate")) {
      db.run("ALTER TABLE tasks ADD COLUMN dueDate TEXT", (alterErr) => {
        if (alterErr) {
          console.error("Error adding dueDate column:", alterErr.message);
        } else {
          console.log("Added dueDate column.");
        }
      });
    }
  });
});

// Get all tasks
app.get("/api/tasks", (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add new task
app.post("/api/tasks", (req, res) => {
  const { title, priority, dueDate } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Task title is required" });
  }

  db.run(
    `INSERT INTO tasks (title, priority, dueDate, completed)
     VALUES (?, ?, ?, 0)`,
    [title.trim(), priority || "Medium", dueDate || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        id: this.lastID,
        title: title.trim(),
        priority: priority || "Medium",
        dueDate: dueDate || null,
        completed: 0,
      });
    }
  );
});

// Toggle task complete/incomplete
app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, task) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const newStatus = task.completed ? 0 : 1;

    db.run(
      "UPDATE tasks SET completed = ? WHERE id = ?",
      [newStatus, id],
      function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }

        res.json({
          id: Number(id),
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
          completed: newStatus,
        });
      }
    );
  });
});

// Edit full task
app.patch("/api/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { title, priority, dueDate } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Task title is required" });
  }

  db.run(
    `UPDATE tasks
     SET title = ?, priority = ?, dueDate = ?
     WHERE id = ?`,
    [title.trim(), priority || "Medium", dueDate || null, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({
        id: Number(id),
        title: title.trim(),
        priority: priority || "Medium",
        dueDate: dueDate || null,
      });
    }
  );
});

// Delete task
app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
import "dotenv/config";
import { createServer } from "node:http";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import mysql from "mysql2/promise";

const scryptAsync = promisify(scrypt);
const PORT = 4000;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "my_planner",
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

async function createTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      salt VARCHAR(255) NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      text VARCHAR(255) NOT NULL,
      due_date DATE NOT NULL,
      repeat_option VARCHAR(50) NOT NULL DEFAULT 'none',
      completed_dates JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = await scryptAsync(password, salt, 64);

  return {
    salt,
    passwordHash: hash.toString("hex"),
  };
}

async function passwordMatches(password, savedUser) {
  const attempted = await hashPassword(password, savedUser.salt);
  const savedHash = Buffer.from(savedUser.password_hash, "hex");
  const attemptedHash = Buffer.from(attempted.passwordHash, "hex");

  return (
    savedHash.length === attemptedHash.length &&
    timingSafeEqual(savedHash, attemptedHash)
  );
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  response.end(JSON.stringify(data));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function parseCompletedDates(completedDates) {
  if (Array.isArray(completedDates)) {
    return completedDates;
  }

  if (!completedDates) {
    return [];
  }

  return JSON.parse(completedDates);
}

function formatTask(row) {
  return {
    id: row.id,
    userId: row.user_id,
    text: row.text,
    dueDate: row.due_date,
    repeatOption: row.repeat_option,
    completedDates: parseCompletedDates(row.completed_dates),
  };
}

async function findTask(taskId, userId) {
  const [rows] = await pool.execute(
    `
      SELECT id, user_id, text, due_date, repeat_option, completed_dates
      FROM tasks
      WHERE id = ? AND user_id = ?
    `,
    [taskId, userId]
  );

  return rows[0] ? formatTask(rows[0]) : null;
}

async function handleRegister(request, response) {
  const { email, password } = await readRequestBody(request);

  if (!email || !password) {
    sendJson(response, 400, { message: "Email and password are required." });
    return;
  }

  if (password.length < 6) {
    sendJson(response, 400, {
      message: "Password must be at least 6 characters.",
    });
    return;
  }

  const [existingUsers] = await pool.execute(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  if (existingUsers.length > 0) {
    sendJson(response, 409, { message: "That email is already registered." });
    return;
  }

  const { salt, passwordHash } = await hashPassword(password);
  const [result] = await pool.execute(
    "INSERT INTO users (email, salt, password_hash) VALUES (?, ?, ?)",
    [email, salt, passwordHash]
  );

  sendJson(response, 201, {
    message: "Account created.",
    user: { id: result.insertId, email },
  });
}

async function handleLogin(request, response) {
  const { email, password } = await readRequestBody(request);
  const [rows] = await pool.execute(
    "SELECT id, email, salt, password_hash FROM users WHERE email = ?",
    [email]
  );
  const user = rows[0];

  if (!user || !(await passwordMatches(password, user))) {
    sendJson(response, 401, { message: "Invalid email or password." });
    return;
  }

  sendJson(response, 200, {
    message: "Login successful.",
    user: { id: user.id, email: user.email },
  });
}

async function handleGetTasks(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    sendJson(response, 400, { message: "User id is required." });
    return;
  }

  const [rows] = await pool.execute(
    `
      SELECT id, user_id, text, due_date, repeat_option, completed_dates
      FROM tasks
      WHERE user_id = ?
      ORDER BY id ASC
    `,
    [userId]
  );

  sendJson(response, 200, { tasks: rows.map(formatTask) });
}

async function handleCreateTask(request, response) {
  const { userId, text, dueDate, repeatOption, completedDates } =
    await readRequestBody(request);

  if (!userId || !text || !dueDate) {
    sendJson(response, 400, { message: "User id, text, and date are required." });
    return;
  }

  const [result] = await pool.execute(
    `
      INSERT INTO tasks (user_id, text, due_date, repeat_option, completed_dates)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      userId,
      text,
      dueDate,
      repeatOption || "none",
      JSON.stringify(completedDates || []),
    ]
  );
  const task = await findTask(result.insertId, userId);

  sendJson(response, 201, { task });
}

async function handleUpdateTask(request, response, taskId) {
  const { userId, text, completedDates } = await readRequestBody(request);

  if (!userId) {
    sendJson(response, 400, { message: "User id is required." });
    return;
  }

  const existingTask = await findTask(taskId, userId);

  if (!existingTask) {
    sendJson(response, 404, { message: "Task not found." });
    return;
  }

  const nextText = text === undefined ? existingTask.text : text.trim();
  const nextCompletedDates =
    completedDates === undefined ? existingTask.completedDates : completedDates;

  if (!nextText) {
    sendJson(response, 400, { message: "Task text is required." });
    return;
  }

  if (!Array.isArray(nextCompletedDates)) {
    sendJson(response, 400, { message: "Completed dates must be an array." });
    return;
  }

  await pool.execute(
    "UPDATE tasks SET text = ?, completed_dates = ? WHERE id = ? AND user_id = ?",
    [nextText, JSON.stringify(nextCompletedDates), taskId, userId]
  );

  const task = await findTask(taskId, userId);

  sendJson(response, 200, { task });
}

async function handleDeleteTask(request, response, taskId) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    sendJson(response, 400, { message: "User id is required." });
    return;
  }

  await pool.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", [
    taskId,
    userId,
  ]);

  sendJson(response, 200, { message: "Task deleted." });
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const taskMatch = url.pathname.match(/^\/api\/tasks\/(\d+)$/);

    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    if (url.pathname === "/api/register" && request.method === "POST") {
      await handleRegister(request, response);
      return;
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      await handleLogin(request, response);
      return;
    }

    if (url.pathname === "/api/tasks" && request.method === "GET") {
      await handleGetTasks(request, response);
      return;
    }

    if (url.pathname === "/api/tasks" && request.method === "POST") {
      await handleCreateTask(request, response);
      return;
    }

    if (taskMatch && request.method === "PATCH") {
      await handleUpdateTask(request, response, Number(taskMatch[1]));
      return;
    }

    if (taskMatch && request.method === "DELETE") {
      await handleDeleteTask(request, response, Number(taskMatch[1]));
      return;
    }

    sendJson(response, 404, { message: "Route not found." });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { message: "Something went wrong." });
  }
});

createTables()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Could not connect to MySQL.");
    console.error(error.message);
  });

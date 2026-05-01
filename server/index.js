import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const PORT = 4000;
const usersFile = new URL("./data/users.json", import.meta.url);

async function ensureUsersFile() {
  await mkdir(new URL("./data/", import.meta.url), { recursive: true });

  try {
    await readFile(usersFile, "utf8");
  } catch {
    await writeFile(usersFile, "[]");
  }
}

async function readUsers() {
  await ensureUsersFile();
  const data = await readFile(usersFile, "utf8");

  return JSON.parse(data);
}

async function writeUsers(users) {
  await writeFile(usersFile, JSON.stringify(users, null, 2));
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
  const savedHash = Buffer.from(savedUser.passwordHash, "hex");
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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

  const users = await readUsers();
  const existingUser = users.find((user) => user.email === email);

  if (existingUser) {
    sendJson(response, 409, { message: "That email is already registered." });
    return;
  }

  const { salt, passwordHash } = await hashPassword(password);
  const newUser = {
    id: Date.now(),
    email,
    salt,
    passwordHash,
  };

  users.push(newUser);
  await writeUsers(users);

  sendJson(response, 201, {
    message: "Account created.",
    user: { id: newUser.id, email: newUser.email },
  });
}

async function handleLogin(request, response) {
  const { email, password } = await readRequestBody(request);
  const users = await readUsers();
  const user = users.find((savedUser) => savedUser.email === email);

  if (!user || !(await passwordMatches(password, user))) {
    sendJson(response, 401, { message: "Invalid email or password." });
    return;
  }

  sendJson(response, 200, {
    message: "Login successful.",
    user: { id: user.id, email: user.email },
  });
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    if (request.url === "/api/register" && request.method === "POST") {
      await handleRegister(request, response);
      return;
    }

    if (request.url === "/api/login" && request.method === "POST") {
      await handleLogin(request, response);
      return;
    }

    sendJson(response, 404, { message: "Route not found." });
  } catch {
    sendJson(response, 500, { message: "Something went wrong." });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// controllers/projectController.js
import path from "path";
import fs from "fs";
import { exec, spawn } from "child_process";
import { callModelForPlan, callModelForFiles } from "../utils/aiClient.js";
import { writeFiles } from "../utils/fsHelpers.js";
import open from "open"; // npm i open
import { runDevServer } from "../utils/runDev.js";

const BASE_DIR = path.resolve("D:/PROJECTS/FINAL YEAR/Projects by AANSH");

// safe templates we support
const SAFE_TEMPLATES = new Set(["vite-react", "nextjs-fullstack", "mern"]);

// sanitize project name
function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
}

function openVSCode(projectPath) {
  // Use cmd so PATH resolves same as terminal
  exec(`cmd.exe /c \"code -n \\\"${projectPath}\\\"\"`, (err) => {
    if (err) console.error("openVSCode err:", err);
  });
}

function spawnVisibleTerminal(projectPath, command) {
  // Windows: open cmd and run command, keep it open (/k)
  // ensure we change drive and dir: cd /d
  const full = `cd /d "${projectPath}" && ${command}`;
  spawn("cmd.exe", ["/k", full], { detached: true, stdio: "ignore" }).unref();
}

// run shell command and return Promise
function runCmd(cmd, cwd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, shell: true }, (err, stdout, stderr) => {
      if (err) return reject({ err, stdout, stderr });
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Main API function: receives natural prompt & projectName.
 * Steps:
 * 1) get plan via LLM
 * 2) validate template
 * 3) create folder, scaffold vite (or next) in-place
 * 4) ask LLM to generate file contents (JSON mapping)
 * 5) write files, install extra deps, init tailwind, etc
 * 6) open VS Code, spawn terminal running dev command, open browser.
 */
export async function createProjectFromPrompt(req, res) {
  try {
    const { prompt, projectName: rawName } = req.body;
    if (!prompt || !rawName) return res.status(400).json({ message: "prompt and projectName required" });

    const projectName = sanitizeName(rawName);
    if (!projectName) return res.status(400).json({ message: "invalid projectName" });

    // 1) Ask model for plan
    const plan = await callModelForPlan(prompt, projectName);
    if (!plan || !plan.template) return res.status(400).json({ message: "AI returned no plan", plan });

    const template = plan.template;
    if (!SAFE_TEMPLATES.has(template)) {
      return res.status(400).json({ message: "Template not supported", template });
    }

    // 2) Prepare directories
    if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
    const projectPath = path.join(BASE_DIR, projectName);
    if (fs.existsSync(projectPath)) return res.status(409).json({ message: "Project already exists", projectPath });
    fs.mkdirSync(projectPath);

    // 3) Scaffold base project depending on template
    if (template === "vite-react") {
      // create vite react in-place
      await runCmd('npm create vite@latest . -- --template react', projectPath).catch(async (err) => {
        // if direct create fails, try creating in parent folder by name
        console.warn("vite in-place failed, trying parent create", err);
        await runCmd(`npm create vite@latest "${projectName}" -- --template react`, BASE_DIR);
      });
    } else if (template === "nextjs-fullstack") {
      await runCmd(`npx create-next-app@latest "${projectName}" --yes`, BASE_DIR);
    } else if (template === "mern") {
      // we create client (vite) + server folders
      const clientDir = path.join(projectPath, "client");
      fs.mkdirSync(clientDir, { recursive: true });
      await runCmd('npm create vite@latest . -- --template react', clientDir);
      const serverDir = path.join(projectPath, "server");
      fs.mkdirSync(serverDir, { recursive: true });
      await runCmd('npm init -y', serverDir);
      await runCmd('npm install express mongoose cors', serverDir);
    }

    // 4) Ask AI to generate component & page files (JSON mapping)
    // We instruct it to produce files for the web UI: components, pages, App.jsx, index.css, and server stubs if mern
    const filesMap = await callModelForFiles(prompt, template, projectName, plan.notes || "");

    // 5) Write files (filesMap keys are relative to project root, or for mern template /client or /server)
    writeFiles(projectPath, filesMap);

    // 6) Install additional dependencies indicated by plan.dependencies or default ones
    const extraDeps = Array.isArray(plan.dependencies) ? plan.dependencies.join(" ") : "";
    if (extraDeps) {
      await runCmd(`cd "${projectPath}" && npm install ${extraDeps}`, projectPath).catch((e) => console.warn("extra deps error", e));
    }

    // If Tailwind is required, install & init inside projectPath (or client for mern)
    // We attempt to detect if filesMap included tailwind usage by searching keys or content
    const usesTailwind = Object.keys(filesMap).some(k => k.includes("tailwind") || k.includes("index.css") || filesMap[k].includes("@tailwind"));
    if (usesTailwind) {
      // run tailwind install & init (Vite project)
      const targetDir = template === "mern" ? path.join(projectPath, "client") : projectPath;
      await runCmd(`cd "${targetDir}" && npm install -D tailwindcss postcss autoprefixer`, targetDir);
      await runCmd(`cd "${targetDir}" && npx tailwindcss init -p`, targetDir);
    }

    // 7) Open VS Code and start dev server in terminal so user sees output
    openVSCode(projectPath);

    // --- ADDITION: Open VS Code using exec as requested ---
    exec(`code "${projectPath}"`, (err) => {
      if (err) console.error("❌ Failed to open VS Code:", err);
    });

    // determine dev command and dev url
    const devCommand = plan.devCommand || (template === "vite-react" ? "npm run dev" : (template === "nextjs-fullstack" ? "npm run dev" : "npm start"));
    const devUrl = plan.devUrl || (template === "vite-react" ? "http://localhost:5173" : "http://localhost:3000");

    // spawn visible terminal that will run install (if needed) and dev start
    // If template is mern we run in client folder
    const runDir = template === "mern" ? path.join(projectPath, "client") : projectPath;
    spawnVisibleTerminal(runDir, `npm install && ${devCommand}`);

    // --- ADDITION: Run dev server automatically as requested ---
    runDevServer(projectPath, devCommand, devUrl);

    // open browser after a small delay (you can implement a port-checker for robustness)
    setTimeout(() => {
      open(devUrl).catch(e => console.warn("open browser failed", e));
    }, 5000);

    // 8) Save conversation / return
    return res.json({
      message: "Project generation started",
      projectPath,
      template,
      devUrl,
    });

  } catch (err) {
    console.error("createProjectFromPrompt error:", err);
    return res.status(500).json({ error: err?.message || err });
  }
}

const fs = require("fs");
const jsonServer = require("json-server");
const multer = require("multer");
const path = require("path");

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db.json"));
const middlewares = jsonServer.defaults({ noCors: true });

const uploadsRoot = path.join(__dirname, "uploads");
const imagesDir = path.join(uploadsRoot, "images");
const archivesDir = path.join(uploadsRoot, "archives");
fs.mkdirSync(imagesDir, { recursive: true });
fs.mkdirSync(archivesDir, { recursive: true });

const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:" && protocol !== "http:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    return hostname.endsWith(".layero.app");
  } catch {
    return false;
  }
};

server.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,POST,PATCH,PUT,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

server.use(middlewares);

server.use("/uploads", require("express").static(uploadsRoot));

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    const ext =
      path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${req.params.id}${ext}`);
  },
});

const archiveStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, archivesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".zip";
    cb(null, `${req.params.id}${ext}`);
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png)$/i.test(file.mimetype);
    cb(ok ? null : new Error("Only jpg/png images"), ok);
  },
});

const uploadArchive = multer({
  storage: archiveStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const ok =
      [".zip", ".rar", ".7z"].includes(ext) ||
      /zip|rar|7z|octet-stream/i.test(file.mimetype);
    cb(ok ? null : new Error("Only zip/rar/7z archives"), ok);
  },
});

function findBot(id) {
  return router.db.get("bots").find({ id: String(id) }).value();
}

function assignBot(id, patch) {
  router.db.get("bots").find({ id: String(id) }).assign(patch).write();
}

server.post("/api/bots/:id/image", (req, res) => {
  uploadImage.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Upload failed" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file" });
    }
    if (!findBot(req.params.id)) {
      return res.status(404).json({ error: "Bot not found" });
    }
    const imagePath = `/uploads/images/${req.file.filename}`;
    assignBot(req.params.id, { image: imagePath });
    res.json({ image: imagePath });
  });
});

server.post("/api/bots/:id/archive", (req, res) => {
  uploadArchive.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Upload failed" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file" });
    }
    if (!findBot(req.params.id)) {
      return res.status(404).json({ error: "Bot not found" });
    }
    const archivePath = `/uploads/archives/${req.file.filename}`;
    assignBot(req.params.id, { archiveUrl: archivePath });
    res.json({ archiveUrl: archivePath });
  });
});

server.get("/api/bots/:id/archive", (req, res) => {
  const bot = findBot(req.params.id);
  if (!bot || !bot.archiveUrl) {
    return res.status(404).json({ error: "Archive not found" });
  }
  const relative = bot.archiveUrl.replace(/^\//, "");
  const absolute = path.join(__dirname, relative);
  if (!fs.existsSync(absolute)) {
    return res.status(404).json({ error: "File missing on server" });
  }
  const downloadName = `${(bot.name || bot.title || "bot").replace(
    /[^\w\u0400-\u04FF.-]+/g,
    "_"
  )}-sources${path.extname(absolute)}`;
  res.download(absolute, downloadName);
});

server.use(router);

const port = Number(process.env.PORT) || 8080;
const host = process.env.HOST || "0.0.0.0";

server.listen(port, host, () => {
  console.log(`JSON Server http://${host}:${port}`);
});

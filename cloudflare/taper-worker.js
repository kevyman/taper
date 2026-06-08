const REPO_BASE = "https://raw.githubusercontent.com/kevyman/taper/main/";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".pdf": "application/pdf",
};

function contentType(path) {
  const dot = path.lastIndexOf(".");
  return CONTENT_TYPES[dot >= 0 ? path.slice(dot).toLowerCase() : ""] || "application/octet-stream";
}

function repoPath(pathname) {
  if (pathname === "/taper") return null;
  if (!pathname.startsWith("/taper/")) return null;

  const path = pathname.slice("/taper/".length) || "index.html";
  if (!/^[A-Za-z0-9._/-]+$/.test(path) || path.includes("..")) return null;
  return path;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/taper") {
      return Response.redirect(`${url.origin}/taper/`, 301);
    }

    const path = repoPath(url.pathname);
    if (!path) return new Response("Not found", { status: 404 });

    const upstream = await fetch(REPO_BASE + path, {
      headers: { "User-Agent": "johnwilkos-taper-worker" },
    });

    if (!upstream.ok) return new Response("Not found", { status: 404 });

    const headers = new Headers(upstream.headers);
    headers.set("Content-Type", contentType(path));
    headers.set("Cache-Control", "public, max-age=300");
    headers.delete("Content-Security-Policy");
    headers.delete("Content-Disposition");
    headers.delete("X-Frame-Options");

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  },
};

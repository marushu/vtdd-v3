import fs from "node:fs/promises";
import path from "node:path";

const distDir = new URL("../dist/", import.meta.url);
const outFile = new URL("../src/static-assets.generated.js", import.meta.url);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"]
]);

const files = await listFiles(distDir);
const entries = [];
for (const file of files) {
  const relative = path.relative(distDir.pathname, file.pathname);
  const route = `/${relative}`;
  const text = await fs.readFile(file, "utf8");
  entries.push([
    route,
    {
      contentType: contentTypes.get(path.extname(route)) || "application/octet-stream",
      body: text
    }
  ]);
}

const source = `export const staticAssets = new Map(${JSON.stringify(entries, null, 2)});\n`;
await fs.writeFile(outFile, source);

async function listFiles(dirUrl) {
  const result = [];
  const dirents = await fs.readdir(dirUrl, { withFileTypes: true });
  for (const dirent of dirents) {
    const child = new URL(dirent.name, dirUrl);
    if (dirent.isDirectory()) {
      result.push(...await listFiles(new URL(`${dirent.name}/`, dirUrl)));
    } else if (dirent.isFile()) {
      result.push(child);
    }
  }
  return result;
}

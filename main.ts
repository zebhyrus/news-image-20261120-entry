import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const targetPath = join(outDir, "entry.png");

const MAX_BYTES = 1048576;
const MAX_SIDE = 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

const data = readFileSync(sourcePath);

if (data.length > MAX_BYTES) {
  fail(`entry.png is ${data.length} bytes, over the 1048576 byte limit`);
}

if (data.length < 33 || !data.subarray(0, 8).equals(PNG_MAGIC)) {
  fail("entry.png does not start with the PNG signature");
}

if (data.readUInt32BE(12) !== 0x49484452) {
  fail("entry.png has no IHDR chunk where one is expected");
}

const width = data.readUInt32BE(16);
const height = data.readUInt32BE(20);

if (width > MAX_SIDE || height > MAX_SIDE) {
  fail(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}

if (width === 0 || height === 0) {
  fail("entry.png has a zero width or height");
}

mkdirSync(outDir, { recursive: true });
writeFileSync(targetPath, data);
console.log(`wrote ${targetPath} (${data.length} bytes, ${width}x${height})`);

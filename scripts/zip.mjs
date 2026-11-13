// Create a standard ZIP using Node's built-in modules; no packaging dependency.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { deflateRawSync } from "node:zlib";
const table = Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(data) {
  let crc = 0xffffffff;
  for (const b of data) crc = table[(crc ^ b) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
export async function zipDirectory(directory, destination) {
  const names = [];
  async function walk(dir, prefix = "") {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (e.isDirectory())
        await walk(dir + "/" + e.name, prefix + e.name + "/");
      else names.push(prefix + e.name);
    }
  }
  await walk(directory);
  names.sort();
  const local = [],
    central = [];
  let offset = 0;
  for (const name of names) {
    const filename = Buffer.from(name, "utf8"),
      raw = await readFile(directory + "/" + name),
      compressed = deflateRawSync(raw),
      crc = crc32(raw);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(33, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(raw.length, 22);
    header.writeUInt16LE(filename.length, 26);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(0x0314, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x800, 8);
    record.writeUInt16LE(8, 10);
    record.writeUInt16LE(33, 14);
    record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(compressed.length, 20);
    record.writeUInt32LE(raw.length, 24);
    record.writeUInt16LE(filename.length, 28);
    record.writeUInt32LE((0o100644 * 65536) >>> 0, 38);
    record.writeUInt32LE(offset, 42);
    local.push(header, filename, compressed);
    central.push(record, filename);
    offset += header.length + filename.length + compressed.length;
  }
  const directoryData = Buffer.concat(central),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(names.length, 8);
  end.writeUInt16LE(names.length, 10);
  end.writeUInt32LE(directoryData.length, 12);
  end.writeUInt32LE(offset, 16);
  await writeFile(destination, Buffer.concat([...local, directoryData, end]));
  console.log(`${destination}: ${names.length} files`);
}

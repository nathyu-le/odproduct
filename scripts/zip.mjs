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
  // Use the build time so cPanel overwrite rules, ETags and PHP opcache notice updates.
  const built = new Date();
  const dosDate =
    ((Math.max(1980, built.getFullYear()) - 1980) << 9) |
    ((built.getMonth() + 1) << 5) |
    built.getDate();
  const dosTime =
    (built.getHours() << 11) |
    (built.getMinutes() << 5) |
    Math.floor(built.getSeconds() / 2);
  for (const name of names) {
    const filename = Buffer.from(name, "utf8"),
      raw = await readFile(directory + "/" + name),
      compressed = deflateRawSync(raw),
      crc = crc32(raw);
    // Unix extended timestamp prevents cPanel/server timezone from changing the file age.
    const extra = Buffer.alloc(9);
    extra.writeUInt16LE(0x5455, 0);
    extra.writeUInt16LE(5, 2);
    extra.writeUInt8(1, 4);
    extra.writeUInt32LE(Math.floor(built.getTime() / 1000), 5);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(dosTime, 10);
    header.writeUInt16LE(dosDate, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(raw.length, 22);
    header.writeUInt16LE(filename.length, 26);
    header.writeUInt16LE(extra.length, 28);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(0x0314, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x800, 8);
    record.writeUInt16LE(8, 10);
    record.writeUInt16LE(dosTime, 12);
    record.writeUInt16LE(dosDate, 14);
    record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(compressed.length, 20);
    record.writeUInt32LE(raw.length, 24);
    record.writeUInt16LE(filename.length, 28);
    record.writeUInt16LE(extra.length, 30);
    record.writeUInt32LE((0o100644 * 65536) >>> 0, 38);
    record.writeUInt32LE(offset, 42);
    local.push(header, filename, extra, compressed);
    central.push(record, filename, extra);
    offset +=
      header.length + filename.length + extra.length + compressed.length;
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

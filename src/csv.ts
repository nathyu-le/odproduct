export function csv(name: string, rows: any[][]) {
  const safe = (v: any) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const b = new Blob(
    ["\uFEFF" + rows.map((row) => row.map(safe).join(",")).join("\r\n")],
    {
      type: "text/csv;charset=utf-8;",
    },
  );
  const u = URL.createObjectURL(b);
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

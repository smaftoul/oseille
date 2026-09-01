// SYLK (Symbolic Link) parser for RNM .xls (actually SYLK text)
// RNM tableur is SYLK, not real Excel binary.

export type SylkRow = Record<number, string>;

export function parseSylk(content: string): { header: string[]; rows: Record<string, string>[] } {
  const lines = content.split(/\r?\n/);
  let lastX = 0;
  let lastY = 0;
  const cells: Record<number, SylkRow> = {};

  for (const line of lines) {
    // F; line sets position for next C;K numeric
    if (line.startsWith("F;")) {
      const mx = line.match(/X(\d+)/);
      const my = line.match(/Y(\d+)/);
      if (mx) lastX = parseInt(mx[1], 10);
      if (my) lastY = parseInt(my[1], 10);
      continue;
    }
    if (line.startsWith("C;")) {
      let x = lastX;
      let y = lastY;
      const mx = line.match(/X(\d+)/);
      const my = line.match(/Y(\d+)/);
      if (mx) x = parseInt(mx[1], 10);
      if (my) y = parseInt(my[1], 10);
      // value: K"quoted" or Knumeric or K""
      let k = "";
      const mQuoted = line.match(/K"([^"]*)"/);
      if (mQuoted) {
        k = mQuoted[1];
      } else {
        const mNum = line.match(/K([^\s;]+)/);
        if (mNum) k = mNum[1];
      }
      // reset last for next?
      if (!line.includes("X") && !line.includes("Y")) {
        // value for previous F position
        x = lastX;
        y = lastY;
      } else {
        // update last
        lastX = x;
        lastY = y;
      }
      if (!cells[y]) cells[y] = {};
      cells[y][x] = k;
    }
  }

  // Header is Y=4
  const headerRow = cells[4];
  if (!headerRow) return { header: [], rows: [] };
  const header: string[] = [];
  for (let x = 1; x <= 9; x++) header.push(headerRow[x] ?? "");

  const rows: Record<string, string>[] = [];
  const ys = Object.keys(cells)
    .map(Number)
    .filter((y) => y >= 5)
    .sort((a, b) => a - b);
  for (const y of ys) {
    const r = cells[y];
    // stop at footer "Source :"
    if (r[1]?.startsWith("Source")) break;
    if (!r[1]) continue;
    const obj: Record<string, string> = {};
    for (let x = 1; x <= 9; x++) {
      const key = header[x - 1] || `COL${x}`;
      obj[key] = r[x] ?? "";
    }
    rows.push(obj);
  }
  return { header, rows };
}

// Filter to Détail national only
export function filterDetail(rows: Record<string, string>[]) {
  return rows.filter((r) => {
    const stade = r["STADE"] ?? "";
    // Keep only Détail and national: Marche contains "DETAIL" + "France"
    // M2502/M2503 are conventional, M3026/M3027 bio specialist
    return stade.toLowerCase().includes("détail") || stade.toLowerCase().includes("detail");
  });
}

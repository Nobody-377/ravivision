/**
 * Native browser Excel export — no third-party library required.
 * Generates a proper .xlsx file using the Open XML SpreadsheetML spec
 * via the browser's built-in Blob/URL APIs.
 */

/** Escape XML special characters in cell text */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Convert column index (0-based) to Excel column letters (A, B, ..., Z, AA, ...) */
function colLetter(n: number): string {
  let s = '';
  n += 1;
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

/** Build the xl/worksheets/sheet1.xml content from rows of cell data */
function buildSheetXml(rows: (string | number | boolean | null)[][]): string {
  const rowsXml = rows
    .map((row, rowIdx) => {
      const cells = row
        .map((cell, colIdx) => {
          const ref = `${colLetter(colIdx)}${rowIdx + 1}`;
          if (cell === null || cell === undefined || cell === '') {
            return `<c r="${ref}"/>`;
          }
          if (typeof cell === 'number') {
            return `<c r="${ref}" t="n"><v>${cell}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(cell))}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowIdx + 1}">${cells}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
}

function buildXlsxBlob(sheetName: string, rows: (string | number | boolean | null)[][]): Blob {
  const sheetXml = buildSheetXml(rows);
  const safeSheetName = sheetName.replace(/[\\/:*?[\]]/g, '_').substring(0, 31);

  const parts: Record<string, string> = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(safeSheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
    'xl/worksheets/sheet1.xml': sheetXml,
  };

  return buildZipBlob(parts);
}

// ─── Minimal ZIP writer ──────────────────────────────────────────────────────

function str2u8(str: string): Uint8Array { return new TextEncoder().encode(str); }
function u32le(n: number): Uint8Array { const b = new Uint8Array(4); b[0]=n&0xff;b[1]=(n>>8)&0xff;b[2]=(n>>16)&0xff;b[3]=(n>>24)&0xff; return b; }
function u16le(n: number): Uint8Array { return new Uint8Array([n&0xff,(n>>8)&0xff]); }

let _crcTable: Uint32Array | null = null;
function makeCrcTable(): Uint32Array {
  if (_crcTable) return _crcTable;
  _crcTable = new Uint32Array(256);
  for (let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;_crcTable[i]=c;}
  return _crcTable;
}
function crc32(data: Uint8Array): number {
  const t=makeCrcTable();let c=0xffffffff;
  for(let i=0;i<data.length;i++)c=(c>>>8)^t[(c^data[i])&0xff];
  return(c^0xffffffff)>>>0;
}
function concat(...arrays: Uint8Array[]): Uint8Array {
  const total=arrays.reduce((s,a)=>s+a.length,0);const r=new Uint8Array(total);let o=0;
  for(const a of arrays){r.set(a,o);o+=a.length;}return r;
}

function buildZipBlob(parts: Record<string, string>): Blob {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(parts)) {
    const nb = str2u8(name); const db = str2u8(content);
    const crc = crc32(db); const size = db.length;
    const local = concat(new Uint8Array([0x50,0x4b,0x03,0x04]),u16le(20),u16le(0),u16le(0),u16le(0),u16le(0),u32le(crc),u32le(size),u32le(size),u16le(nb.length),u16le(0),nb,db);
    const central = concat(new Uint8Array([0x50,0x4b,0x01,0x02]),u16le(20),u16le(20),u16le(0),u16le(0),u16le(0),u16le(0),u32le(crc),u32le(size),u32le(size),u16le(nb.length),u16le(0),u16le(0),u16le(0),u16le(0),u32le(0),u32le(offset),nb);
    locals.push(local); centrals.push(central); offset += local.length;
  }
  const cd = concat(...centrals);
  const eocd = concat(new Uint8Array([0x50,0x4b,0x05,0x06]),u16le(0),u16le(0),u16le(locals.length),u16le(locals.length),u32le(cd.length),u32le(offset),u16le(0));
  const zipBuffer = concat(...locals, cd, eocd);
  return new Blob([zipBuffer.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function exportToExcel(filename: string, sheetName: string, data: any[]): void {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows: (string | number | boolean | null)[][] = [
    headers,
    ...data.map((obj) => headers.map((h) => obj[h] ?? null)),
  ];
  const blob = buildXlsxBlob(sheetName, rows);
  const date = new Date().toISOString().split('T')[0];
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}_${date}.xlsx`; a.click();
  URL.revokeObjectURL(url);
}

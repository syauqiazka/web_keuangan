/**
 * Modul parsing dan penanganan paste TSV (Tab-Separated Values) dari Excel / Google Sheets
 * Sesuai AGENTS.md bagian 4.0 dan DESIGN.md bagian 7
 */

export interface ParsedPasteResult {
  matrix: string[][];
  rowCount: number;
  colCount: number;
}

/**
 * Mem-parse teks TSV dari clipboard menjadi matriks 2D string[][].
 * Menangani baris kosong di akhir, pemisah baris \r\n, \n, atau \r,
 * serta sel yang dibungkus tanda kutip (RFC 4180 / Excel format).
 */
export function parseTsv(text: string): string[][] {
  if (!text) return [];

  // Hilangkan BOM jika ada
  let cleanText = text.replace(/^\uFEFF/, "");

  // Hapus baris kosong di akhir saja (jangan hapus whitespace di dalam sel)
  cleanText = cleanText.replace(/[\r\n]+$/, "");
  if (!cleanText) return [];

  const rows: string[][] = [];
  const lines = cleanText.split(/\r\n|\n|\r/);

  for (const line of lines) {
    const cells = line.split("\t").map((cell) => {
      let val = cell.trim();
      // Unquote jika dibungkus tanda kutip ganda "" (format Excel TSV saat ada teks khusus)
      if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      return val;
    });
    rows.push(cells);
  }

  return rows;
}

/**
 * Validasi hasil paste ke dalam field target.
 * Menerima validator per nama kolom.
 */
export type CellValidator<T> = (val: string, row: T) => { valid: boolean; error?: string; parsedValue?: unknown };

export interface PasteApplyOptions<T> {
  currentData: T[];
  startRowIndex: number;
  startColIndex: number;
  columnKeys: (keyof T | string)[];
  createNewRow: () => T;
  validators?: Record<string, CellValidator<T>>;
}

export interface AppliedPasteResult<T> {
  newData: T[];
  errors: Record<string, string>; // key: `${rowIndex}_${colKey}`
  hasErrors: boolean;
}

export function applyTsvPaste<T extends Record<string, unknown>>(
  tsvText: string,
  options: PasteApplyOptions<T>
): AppliedPasteResult<T> {
  const matrix = parseTsv(tsvText);
  if (matrix.length === 0) {
    return {
      newData: [...options.currentData],
      errors: {},
      hasErrors: false,
    };
  }

  const result: T[] = options.currentData.map((row) => ({ ...row }));
  const errors: Record<string, string> = {};

  const { startRowIndex, startColIndex, columnKeys, createNewRow, validators } = options;

  matrix.forEach((pasteRow, rOffset) => {
    const targetRowIdx = startRowIndex + rOffset;

    // Tambah baris baru jika targetRowIdx melebihi panjang data saat ini
    while (result.length <= targetRowIdx) {
      result.push(createNewRow());
    }

    const row = result[targetRowIdx];

    pasteRow.forEach((cellValue, cOffset) => {
      const targetColIdx = startColIndex + cOffset;
      if (targetColIdx < columnKeys.length) {
        const colKey = columnKeys[targetColIdx] as string;
        
        // Simpan nilai sel
        (row as Record<string, unknown>)[colKey] = cellValue;

        // Validasi jika ada validator
        if (validators && validators[colKey]) {
          const check = validators[colKey](cellValue, row);
          const errorKey = `${targetRowIdx}_${colKey}`;
          if (!check.valid) {
            errors[errorKey] = check.error ?? "Nilai tidak valid.";
          }
        }
      }
    });
  });

  return {
    newData: result,
    errors,
    hasErrors: Object.keys(errors).length > 0,
  };
}

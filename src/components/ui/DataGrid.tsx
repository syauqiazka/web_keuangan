"use client";

import * as React from "react";
import { formatRupiah } from "@/lib/money";
import { parseTsv } from "@/lib/tsv-paste";
import { Button } from "./Button";

export interface ColumnDef<T> {
  id: string;
  header: string;
  group?: string;
  align?: "left" | "right" | "center";
  sticky?: boolean;
  stickyOffset?: number;
  width?: string;
  isMono?: boolean;
  isMoney?: boolean;
  editable?: boolean;
  render?: (row: T, index: number, isEditing: boolean) => React.ReactNode;
  renderEdit?: (
    row: T,
    index: number,
    value: unknown,
    onChange: (newValue: unknown) => void,
    inputProps: {
      onKeyDown: (e: React.KeyboardEvent) => void;
      onPaste: (e: React.ClipboardEvent) => void;
      "data-grid-cell": string;
      hasError: boolean;
      errorMessage?: string;
    }
  ) => React.ReactNode;
  validate?: (val: unknown, row: T) => { valid: boolean; error?: string };
}

export interface ColumnGroupDef {
  title: string;
  columnsCount: number;
}

export interface DataGridProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyField: (row: T, index: number) => string;
  columnGroups?: ColumnGroupDef[];
  totals?: Record<string, number | string>;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  onCancelEdit?: () => void;
  onSave?: (data: T[]) => Promise<void> | void;
  onAddRow?: () => void;
  createNewRow?: () => T;
  enablePaste?: boolean;
  emptyMessage?: string;
  className?: string;
  isSaving?: boolean;
  showToolbar?: boolean;
  toolbarExtra?: React.ReactNode;
}

export function DataGrid<T>({
  columns,
  data: initialData,
  keyField,
  columnGroups,
  totals,
  isEditing = false,
  onToggleEdit,
  onCancelEdit,
  onSave,
  onAddRow,
  createNewRow,
  enablePaste = true,
  emptyMessage = "Belum ada data.",
  className = "",
  isSaving = false,
  showToolbar = false,
  toolbarExtra,
}: DataGridProps<T>) {
  const containerId = React.useId();

  // Data lokal di dalam grid saat mode edit
  const [gridData, setGridData] = React.useState<T[]>(initialData);
  const [unsavedRowIndices, setUnsavedRowIndices] = React.useState<Set<number>>(new Set());
  const [cellErrors, setCellErrors] = React.useState<Record<string, string>>({}); // key: `${rowIndex}_${colId}`
  const [focusedCell, setFocusedCell] = React.useState<{ row: number; col: number } | null>(null);

  // Sync saat data berubah atau keluar dari mode edit
  const [prevData, setPrevData] = React.useState(initialData);
  const [prevEditing, setPrevEditing] = React.useState(isEditing);

  if (!isEditing && (initialData !== prevData || isEditing !== prevEditing)) {
    setPrevData(initialData);
    setPrevEditing(isEditing);
    setGridData(initialData);
    setUnsavedRowIndices(new Set());
    setCellErrors({});
  }

  // Peringatan unsaved changes saat pengguna meninggalkan halaman
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedRowIndices.size > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedRowIndices.size]);

  const focusCell = (rowIdx: number, colIdx: number) => {
    if (typeof document === "undefined") return;
    const container = document.getElementById(containerId);
    const el = container?.querySelector<HTMLElement>(
      `[data-grid-cell="${rowIdx}-${colIdx}"]`
    );
    if (el) {
      el.focus();
      if ("select" in el && typeof (el as HTMLInputElement).select === "function") {
        (el as HTMLInputElement).select();
      }
      setFocusedCell({ row: rowIdx, col: colIdx });
    }
  };

  const handleCellChange = (rowIdx: number, colId: string, value: unknown) => {
    setGridData((prev) => {
      const next = [...prev];
      const row = { ...next[rowIdx], [colId]: value };
      next[rowIdx] = row;
      return next;
    });

    setUnsavedRowIndices((prev) => {
      const next = new Set(prev);
      next.add(rowIdx);
      return next;
    });

    // Validasi sel jika ada aturan validasi
    const colDef = columns.find((c) => c.id === colId);
    if (colDef?.validate) {
      const res = colDef.validate(value, gridData[rowIdx]);
      const errKey = `${rowIdx}_${colId}`;
      setCellErrors((prev) => {
        const next = { ...prev };
        if (!res.valid) {
          next[errKey] = res.error ?? "Nilai tidak valid.";
        } else {
          delete next[errKey];
        }
        return next;
      });
    }
  };

  const handleCellKeyDown = (
    e: React.KeyboardEvent,
    rowIdx: number,
    colIdx: number
  ) => {
    if (e.key === "Enter") {
      // Enter di dalam sel: pindah ke sel di bawahnya (bukan menyimpan baris!)
      e.preventDefault();
      const nextRow = rowIdx + 1;
      if (nextRow < gridData.length) {
        focusCell(nextRow, colIdx);
      } else if (onAddRow || createNewRow) {
        // Jika sudah di baris terakhir, tambah baris baru otomatis
        handleTambahBaris(colIdx);
      }
    } else if (e.key === "Escape") {
      (e.target as HTMLElement).blur();
    }
  };

  const handleTambahBaris = (focusColIdx = 0) => {
    let newRowObj: T;
    if (createNewRow) {
      newRowObj = createNewRow();
    } else {
      newRowObj = {} as T;
    }

    setGridData((prev) => [...prev, newRowObj]);
    setUnsavedRowIndices((prev) => {
      const next = new Set(prev);
      next.add(gridData.length);
      return next;
    });

    if (onAddRow) {
      onAddRow();
    }

    setTimeout(() => {
      focusCell(gridData.length, focusColIdx);
    }, 50);
  };

  const handlePaste = (
    e: React.ClipboardEvent,
    startRowIdx: number,
    startColIdx: number
  ) => {
    if (!enablePaste || !isEditing) return;

    const clipboardText = e.clipboardData.getData("text/plain");
    if (!clipboardText) return;

    e.preventDefault();
    const matrix = parseTsv(clipboardText);
    if (matrix.length === 0) return;

    const editableCols = columns.map((col, idx) => ({ col, idx })).filter((c) => c.col.editable);
    const startEditablePos = editableCols.findIndex((c) => c.idx === startColIdx);
    if (startEditablePos === -1) return;

    const nextData = [...gridData];
    const newUnsaved = new Set(unsavedRowIndices);
    const newErrors = { ...cellErrors };

    matrix.forEach((pRow, rOffset) => {
      const targetRowIdx = startRowIdx + rOffset;

      while (nextData.length <= targetRowIdx) {
        const fresh = createNewRow ? createNewRow() : ({} as T);
        nextData.push(fresh);
      }

      newUnsaved.add(targetRowIdx);
      const row = { ...nextData[targetRowIdx] };

      pRow.forEach((val, cOffset) => {
        const editableTargetPos = startEditablePos + cOffset;
        if (editableTargetPos < editableCols.length) {
          const { col } = editableCols[editableTargetPos];
          (row as Record<string, unknown>)[col.id] = val;

          if (col.validate) {
            const check = col.validate(val, row);
            const errKey = `${targetRowIdx}_${col.id}`;
            if (!check.valid) {
              newErrors[errKey] = check.error ?? "Nilai tidak valid.";
            } else {
              delete newErrors[errKey];
            }
          }
        }
      });

      nextData[targetRowIdx] = row;
    });

    setGridData(nextData);
    setUnsavedRowIndices(newUnsaved);
    setCellErrors(newErrors);
  };

  const handleCancel = () => {
    if (unsavedRowIndices.size > 0) {
      const confirmDiscard = window.confirm(
        `Terdapat ${unsavedRowIndices.size} baris perubahan yang belum disimpan. Batalkan dan buang semua perubahan?`
      );
      if (!confirmDiscard) return;
    }
    setGridData(initialData);
    setUnsavedRowIndices(new Set());
    setCellErrors({});
    if (onCancelEdit) {
      onCancelEdit();
    } else if (onToggleEdit) {
      onToggleEdit();
    }
  };

  const handleSave = async () => {
    if (Object.keys(cellErrors).length > 0) {
      alert("Terdapat data yang belum valid. Silakan periksa sel yang bermasalah sebelum menyimpan.");
      return;
    }
    if (onSave) {
      await onSave(gridData);
      setUnsavedRowIndices(new Set());
    }
  };

  const hasErrors = Object.keys(cellErrors).length > 0;
  const displayData = isEditing ? gridData : initialData;

  return (
    <div id={containerId} className={`w-full space-y-3 ${className}`}>
      {/* Toolbar Grid (Aksi Tambah Baris, Status Perubahan, Batal, Simpan) */}
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleTambahBaris(0)}
                >
                  + Tambah Baris Baru
                </Button>
                {toolbarExtra}
              </>
            ) : (
              onToggleEdit && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onToggleEdit}
                >
                  Mulai Edit Data
                </Button>
              )
            )}
          </div>

          {isEditing && (
            <div className="flex flex-wrap items-center gap-2.5">
              {unsavedRowIndices.size > 0 && (
                <span className="text-[12px] text-text-3 font-medium">
                  <span className="text-warning font-semibold">{unsavedRowIndices.size} baris</span> belum disimpan
                </span>
              )}
              {hasErrors && (
                <span className="text-[12px] text-danger font-medium">
                  Periksa sel bertanda merah
                </span>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isSaving}
                onClick={handleCancel}
              >
                Batal Edit
              </Button>
              {onSave && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isSaving || hasErrors}
                  onClick={handleSave}
                >
                  {isSaving ? "Menyimpan perubahan…" : "Simpan Perubahan"}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabel Data Asli */}
      <div className="w-full overflow-x-auto border border-line bg-surface rounded-[12px] shadow-xs">
        <table className="w-full border-collapse text-[13px]">
          {/* Header Grup Jika Ada */}
          {columnGroups && columnGroups.length > 0 && (
            <thead>
              <tr className="border-b border-line bg-panel/70 text-text">
                {columnGroups.map((grp, i) => (
                  <th
                    key={`${grp.title}-${i}`}
                    colSpan={grp.columnsCount}
                    className="px-3 py-2 text-center font-semibold border-r border-line last:border-r-0"
                  >
                    {grp.title}
                  </th>
                ))}
                {isEditing && <th className="w-28 border-b border-line"></th>}
              </tr>
            </thead>
          )}

          {/* Header Kolom */}
          <thead>
            <tr className="border-b border-line bg-panel/50 text-text-2">
              {columns.map((col) => {
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";

                const stickyClass = col.sticky
                  ? "sticky left-0 bg-surface z-10"
                  : "";

                return (
                  <th
                    key={col.id}
                    style={{
                      width: col.width,
                      left:
                        col.sticky && col.stickyOffset !== undefined
                          ? `${col.stickyOffset}px`
                          : undefined,
                    }}
                    className={`px-3 py-2.5 h-10 font-semibold whitespace-nowrap ${alignClass} ${stickyClass}`}
                  >
                    {col.header}
                  </th>
                );
              })}
              {isEditing && (
                <th className="px-3 py-2.5 h-10 text-right font-semibold text-text-2 w-28 whitespace-nowrap">
                  Status
                </th>
              )}
            </tr>
          </thead>

          {/* Isi Baris */}
          <tbody className="divide-y divide-line">
            {displayData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (isEditing ? 1 : 0)}
                  className="px-4 py-12 text-center text-text-3 font-normal"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, rowIndex) => {
                const isUnsaved = unsavedRowIndices.has(rowIndex);

                return (
                  <tr
                    key={keyField(row, rowIndex)}
                    className={`h-10 transition-colors ${
                      isUnsaved ? "bg-surface-soft/60" : "hover:bg-panel/40"
                    }`}
                  >
                    {columns.map((col, colIndex) => {
                      const alignClass =
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left";

                      const stickyClass = col.sticky
                        ? "sticky left-0 bg-surface z-10"
                        : "";

                      const isCellFocused =
                        focusedCell?.row === rowIndex && focusedCell?.col === colIndex;

                      const errKey = `${rowIndex}_${col.id}`;
                      const cellError = cellErrors[errKey];

                      const cellEditingClass = isCellFocused
                        ? "bg-surface-soft ring-1 ring-brand"
                        : "";

                      const cellErrorClass = cellError
                        ? "ring-1 ring-danger text-danger"
                        : "";

                      const rawValue = (row as Record<string, unknown>)[col.id];

                      return (
                        <td
                          key={col.id}
                          style={{
                            left:
                              col.sticky && col.stickyOffset !== undefined
                                ? `${col.stickyOffset}px`
                                : undefined,
                          }}
                          className={`px-3 py-2 whitespace-nowrap ${alignClass} ${stickyClass} ${cellEditingClass} ${cellErrorClass} ${
                            col.isMono ? "font-mono" : ""
                          } ${col.isMoney || col.align === "right" ? "num" : ""}`}
                          onClick={() => {
                            if (isEditing && col.editable) {
                              focusCell(rowIndex, colIndex);
                            }
                          }}
                        >
                          {isEditing && col.editable ? (
                            col.renderEdit ? (
                              col.renderEdit(
                                row,
                                rowIndex,
                                rawValue,
                                (val) => handleCellChange(rowIndex, col.id, val),
                                {
                                  onKeyDown: (e) =>
                                    handleCellKeyDown(e, rowIndex, colIndex),
                                  onPaste: (e) =>
                                    handlePaste(e, rowIndex, colIndex),
                                  "data-grid-cell": `${rowIndex}-${colIndex}`,
                                  hasError: Boolean(cellError),
                                  errorMessage: cellError,
                                }
                              )
                            ) : (
                              <div className="relative">
                                <input
                                  data-grid-cell={`${rowIndex}-${colIndex}`}
                                  type="text"
                                  value={typeof rawValue === "string" || typeof rawValue === "number" ? String(rawValue) : ""}
                                  onChange={(e) =>
                                    handleCellChange(rowIndex, col.id, e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    handleCellKeyDown(e, rowIndex, colIndex)
                                  }
                                  onPaste={(e) =>
                                    handlePaste(e, rowIndex, colIndex)
                                  }
                                  onFocus={() =>
                                    setFocusedCell({ row: rowIndex, col: colIndex })
                                  }
                                  className={`w-full bg-surface text-[13px] px-2 py-1 border border-line rounded-[6px] outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-inherit ${alignClass}`}
                                />
                                {cellError && (
                                  <span className="block text-[11px] text-danger mt-0.5">
                                    {cellError}
                                  </span>
                                )}
                              </div>
                            )
                          ) : col.render ? (
                            col.render(row, rowIndex, isEditing)
                          ) : col.isMoney ? (
                            typeof rawValue === "number" ? (
                              formatRupiah(rawValue)
                            ) : (
                              String(rawValue ?? "-")
                            )
                          ) : (
                            String(rawValue ?? "-")
                          )}
                        </td>
                      );
                    })}

                    {isEditing && (
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {isUnsaved && (
                          <span className="font-mono text-[11px] text-label font-medium bg-label/10 px-1.5 py-0.5 rounded">
                            Belum disimpan
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Baris Total di Kaki Tabel Jika Ada */}
          {totals && (
            <tfoot>
              <tr className="border-t-2 border-line bg-panel/60 h-10 font-semibold">
                {columns.map((col, idx) => {
                  const val = totals[col.id];
                  const alignClass =
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left";

                  const stickyClass = col.sticky
                    ? "sticky left-0 bg-surface z-10"
                    : "";

                  return (
                    <td
                      key={`total-${col.id}`}
                      className={`px-3 py-2 whitespace-nowrap text-text ${alignClass} ${stickyClass} num`}
                    >
                      {idx === 0 && val === undefined
                        ? "Total"
                        : val !== undefined
                        ? typeof val === "number"
                          ? formatRupiah(val)
                          : val
                        : ""}
                    </td>
                  );
                })}
                {isEditing && <td className="px-3 py-2"></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

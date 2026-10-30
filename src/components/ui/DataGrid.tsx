"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Pencil, Check, X, AlertCircle, Info } from "lucide-react";
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
  areaTheme?: "income" | "expense" | "neutral";
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
  areaTheme = "neutral",
}: DataGridProps<T>) {
  const containerId = React.useId();

  // Data lokal di dalam grid saat mode edit
  const [gridData, setGridData] = React.useState<T[]>(initialData);
  const [unsavedRowIndices, setUnsavedRowIndices] = React.useState<Set<number>>(new Set());
  const [cellErrors, setCellErrors] = React.useState<Record<string, string>>({}); // key: `${rowIndex}_${colId}`
  const [focusedCell, setFocusedCell] = React.useState<{ row: number; col: number } | null>(null);
  // Track indeks baris yang baru ditambahkan untuk animasi fade-in
  const [newRowIndices, setNewRowIndices] = React.useState<Set<number>>(new Set());

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

    const newIdx = gridData.length;
    setGridData((prev) => [...prev, newRowObj]);
    setUnsavedRowIndices((prev) => {
      const next = new Set(prev);
      next.add(newIdx);
      return next;
    });
    // Tandai baris baru untuk animasi; hapus tanda setelah animasi selesai
    setNewRowIndices((prev) => {
      const next = new Set(prev);
      next.add(newIdx);
      return next;
    });
    setTimeout(() => {
      setNewRowIndices((prev) => {
        const next = new Set(prev);
        next.delete(newIdx);
        return next;
      });
    }, 600);

    if (onAddRow) {
      onAddRow();
    }

    setTimeout(() => {
      focusCell(newIdx, focusColIdx);
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
      {/* Banner Mode Edit Aktif — slide-down masuk, slide-up keluar */}
      <AnimatePresence initial={false}>
        {isEditing && (
          <motion.div
            key="edit-banner"
            initial={{ opacity: 0, y: -8, scaleY: 0.92 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ transformOrigin: "top" }}
            className="p-3.5 rounded-[8px] bg-gold-soft border border-gold-border text-gold-text text-[13px] flex items-center gap-2.5 font-medium shadow-xs"
          >
            <Info className="w-4 h-4 shrink-0 text-gold-text" />
            <span>
              Mode edit aktif. Ubah data lalu klik <strong>Simpan Perubahan</strong> untuk menyimpan, atau <strong>Batal</strong> untuk membuang.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar Grid (Aksi Tambah Baris, Status Perubahan, Batal, Simpan) */}
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline-brand"
                  size="sm"
                  onClick={() => handleTambahBaris(0)}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Baris Baru</span>
                </Button>
                {toolbarExtra}
              </>
            ) : (
              onToggleEdit && (
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={onToggleEdit}
                >
                  <Pencil className="w-4 h-4" />
                  <span>Mulai Edit Data</span>
                </Button>
              )
            )}
          </div>

          {isEditing && (
            <div className="flex flex-wrap items-center gap-2.5">
              {unsavedRowIndices.size > 0 && (
                <span className="text-[12px] font-medium text-gold-text flex items-center gap-1.5 bg-gold-soft px-2.5 py-1 rounded-[6px] border border-gold-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  <span className="font-bold">{unsavedRowIndices.size} baris</span> belum disimpan
                </span>
              )}
              {hasErrors && (
                <span className="text-[12px] text-danger font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Periksa sel bertanda merah</span>
                </span>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isSaving}
                onClick={handleCancel}
              >
                <X className="w-4 h-4" />
                <span>Batal Edit</span>
              </Button>
              {onSave && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isSaving || hasErrors}
                  onClick={handleSave}
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Menyimpan perubahan…" : "Simpan Perubahan"}</span>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabel Data Asli dengan Garis Tepi Emas Tipis saat Mode Edit */}
      <div
        className={`w-full max-h-[calc(100dvh-16rem)] overflow-auto bg-surface rounded-[12px] shadow-xs transition-all ${
          isEditing
            ? "border border-gold-border ring-1 ring-gold-border"
            : "border border-line"
        }`}
      >
        <table className="w-full border-collapse text-[14px]">
          <thead className="sticky top-0 z-20 shadow-xs">
            {/* Header Grup Jika Ada */}
            {columnGroups && columnGroups.length > 0 && (
              <tr className="border-b border-line bg-panel text-text">
                {columnGroups.map((grp, i) => (
                  <th
                    key={`${grp.title}-${i}`}
                    colSpan={grp.columnsCount}
                    className="px-3 py-2 text-center font-semibold border-r border-line last:border-r-0"
                  >
                    {grp.title}
                  </th>
                ))}
                {isEditing && <th className="w-28 border-b border-line bg-panel"></th>}
              </tr>
            )}

            {/* Header Kolom */}
            <tr
              className={`border-b ${
                areaTheme === "income"
                  ? "border-income-border bg-income-soft text-income-text"
                  : areaTheme === "expense"
                  ? "border-expense-border bg-expense-soft text-expense-text"
                  : "border-line bg-panel text-text-2"
              }`}
            >
              {columns.map((col) => {
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";

                const stickyClass = col.sticky
                  ? `sticky left-0 z-30 ${
                      areaTheme === "income"
                        ? "bg-income-soft text-income-text"
                        : areaTheme === "expense"
                        ? "bg-expense-soft text-expense-text"
                        : "bg-surface"
                    }`
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
                <th
                  className={`px-3 py-2.5 h-10 text-right font-semibold w-28 whitespace-nowrap ${
                    areaTheme === "income"
                      ? "text-income-text"
                      : areaTheme === "expense"
                      ? "text-expense-text"
                      : "text-text-2"
                  }`}
                >
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
                const zebraBg =
                  areaTheme === "income" && rowIndex % 2 === 1
                    ? "bg-income-soft/20"
                    : areaTheme === "expense" && rowIndex % 2 === 1
                    ? "bg-expense-soft/25"
                    : "bg-surface";

                const isNewRow = newRowIndices.has(rowIndex);

                return (
                  <motion.tr
                    key={keyField(row, rowIndex)}
                    initial={isNewRow ? { opacity: 0, y: -10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={isNewRow ? { duration: 0.28, ease: "easeOut" } : undefined}
                    className={`h-11 transition-colors ${
                      isUnsaved
                        ? "bg-gold-soft/60"
                        : areaTheme === "income"
                        ? `hover:bg-income-soft/40 ${zebraBg}`
                        : areaTheme === "expense"
                        ? `hover:bg-expense-soft/40 ${zebraBg}`
                        : "hover:bg-panel/40"
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
                        ? "bg-gold-soft ring-1 ring-gold"
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
                                  className={`w-full bg-surface text-[14px] px-2.5 py-1.5 border border-line-strong rounded-[6px] outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-inherit ${alignClass}`}
                                />
                                {cellError && (
                                  <span className="block text-[12px] text-danger mt-0.5">
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
                          <span className="text-[11px] font-semibold text-gold-text bg-gold-soft border border-gold-border px-2 py-0.5 rounded-[4px]">
                            Belum disimpan
                          </span>
                        )}
                      </td>
                    )}
                  </motion.tr>
                );
              })
            )}
          </tbody>

          {/* Baris Total di Kaki Tabel Jika Ada */}
          {totals && (
            <tfoot>
              <tr
                className={`border-t-2 h-10 font-semibold ${
                  areaTheme === "income"
                    ? "border-income-border bg-income-soft text-income-text"
                    : areaTheme === "expense"
                    ? "border-expense-border bg-expense-soft text-expense-text"
                    : "border-line bg-panel/60 text-text"
                }`}
              >
                {columns.map((col, idx) => {
                  const val = totals[col.id];
                  const alignClass =
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left";

                  const stickyClass = col.sticky
                    ? "sticky left-0 bg-inherit z-10"
                    : "";

                  return (
                    <td
                      key={`total-${col.id}`}
                      className={`px-3 py-2 whitespace-nowrap ${alignClass} ${stickyClass} num font-semibold`}
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

      {/* Floating Bottom Action Bar saat Mode Edit memiliki Perubahan Belum Disimpan */}
      {isEditing && unsavedRowIndices.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface border border-gold-border shadow-overlay rounded-[12px] px-5 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="text-[13px] font-medium text-text flex items-center gap-2 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse shrink-0" />
            <span>
              <strong className="text-gold-text font-bold">{unsavedRowIndices.size}</strong> perubahan belum disimpan
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={handleCancel}
            >
              <X className="w-4 h-4" />
              <span>Batal</span>
            </Button>
            {onSave && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isSaving || hasErrors}
                onClick={handleSave}
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? "Menyimpan…" : "Simpan Perubahan"}</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

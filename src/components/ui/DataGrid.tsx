"use client";

import * as React from "react";
import { formatRupiah } from "@/lib/money";

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
  render?: (row: T, index: number, isEditing: boolean) => React.ReactNode;
  editable?: boolean;
}

export interface ColumnGroupDef {
  title: string;
  columnsCount: number;
}

export interface DataGridProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyField: (row: T) => string;
  columnGroups?: ColumnGroupDef[];
  totals?: Record<string, number | string>;
  isRowUnsaved?: (row: T, index: number) => boolean;
  onSaveRow?: (row: T, index: number) => Promise<void> | void;
  onCancelEdit?: (row: T, index: number) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataGrid<T>({
  columns,
  data,
  keyField,
  columnGroups,
  totals,
  isRowUnsaved,
  onSaveRow,
  onCancelEdit,
  emptyMessage = "Belum ada data.",
  className = "",
}: DataGridProps<T>) {
  const [editingRowIndex, setEditingRowIndex] = React.useState<number | null>(null);
  const [editingColId, setEditingColId] = React.useState<string | null>(null);

  const handleKeyDown = (
    e: React.KeyboardEvent,
    row: T,
    rowIndex: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (onSaveRow) {
        onSaveRow(row, rowIndex);
      }
      setEditingRowIndex(null);
      setEditingColId(null);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (onCancelEdit) {
        onCancelEdit(row, rowIndex);
      }
      setEditingRowIndex(null);
      setEditingColId(null);
    }
  };

  return (
    <div className={`w-full overflow-x-auto border border-line ${className}`}>
      <table className="w-full border-collapse text-[14px]">
        {/* Header Grup Jika Ada */}
        {columnGroups && columnGroups.length > 0 && (
          <thead>
            <tr className="border-b border-line-strong bg-canvas">
              {columnGroups.map((grp, i) => (
                <th
                  key={`${grp.title}-${i}`}
                  colSpan={grp.columnsCount}
                  className="px-3 py-2 text-center font-semibold text-text border-r border-line-strong last:border-r-0"
                >
                  {grp.title}
                </th>
              ))}
            </tr>
          </thead>
        )}

        {/* Header Kolom */}
        <thead>
          <tr className="border-b border-line-strong bg-canvas">
            {columns.map((col) => {
              const alignClass =
                col.align === "right"
                  ? "text-right"
                  : col.align === "center"
                  ? "text-center"
                  : "text-left";

              const stickyClass = col.sticky
                ? "sticky left-0 bg-canvas z-10"
                : "";

              return (
                <th
                  key={col.id}
                  style={{
                    width: col.width,
                    left: col.sticky && col.stickyOffset !== undefined ? `${col.stickyOffset}px` : undefined,
                  }}
                  className={`px-3 py-2.5 h-10 font-semibold text-text whitespace-nowrap ${alignClass} ${stickyClass}`}
                >
                  {col.header}
                </th>
              );
            })}
              {isRowUnsaved && (
                <th className="px-3 py-2.5 h-10 text-right font-semibold text-text w-28 whitespace-nowrap">
                  Status
                </th>
              )}
            </tr>
          </thead>

          {/* Isi Baris */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (isRowUnsaved ? 1 : 0)}
                  className="px-4 py-8 text-center text-text-3 font-[360]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const isUnsaved = isRowUnsaved ? isRowUnsaved(row, rowIndex) : false;
                const isEditing = editingRowIndex === rowIndex;

                return (
                  <tr
                    key={keyField(row)}
                    onKeyDown={(e) => handleKeyDown(e, row, rowIndex)}
                    className={`border-b border-line h-10 transition-colors ${
                      isUnsaved ? "bg-panel" : "hover:bg-panel"
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
                        ? "sticky left-0 bg-canvas z-10"
                        : "";

                      const isColEditing = isEditing && editingColId === col.id;
                      const cellEditingClass = isColEditing
                        ? "bg-canvas outline outline-1 outline-text -outline-offset-1"
                        : "";

                      return (
                        <td
                          key={col.id}
                          style={{
                            left: col.sticky && col.stickyOffset !== undefined ? `${col.stickyOffset}px` : undefined,
                          }}
                          onClick={() => {
                            if (col.editable) {
                              setEditingRowIndex(rowIndex);
                              setEditingColId(col.id);
                            }
                          }}
                          className={`px-3 py-2 whitespace-nowrap ${alignClass} ${stickyClass} ${cellEditingClass} ${
                            col.isMono ? "font-mono" : ""
                          } ${col.isMoney || col.align === "right" ? "num" : ""}`}
                        >
                          {col.render
                            ? col.render(row, rowIndex, isEditing)
                            : col.isMoney
                            ? typeof (row as Record<string, unknown>)[col.id] === "number"
                              ? formatRupiah((row as Record<string, unknown>)[col.id] as number)
                              : String((row as Record<string, unknown>)[col.id] ?? "-")
                            : String((row as Record<string, unknown>)[col.id] ?? "-")}
                        </td>
                      );
                    })}

                    {isRowUnsaved && (
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {isUnsaved && (
                          <span className="font-mono text-[12px] text-label font-medium">
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
              <tr className="border-t border-text bg-canvas h-10 font-semibold">
                {columns.map((col, idx) => {
                  const val = totals[col.id];
                  const alignClass =
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left";

                  const stickyClass = col.sticky
                    ? "sticky left-0 bg-canvas z-10"
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
                {isRowUnsaved && <td className="px-3 py-2"></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
  );
}

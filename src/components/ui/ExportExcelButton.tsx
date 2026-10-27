"use client";

import * as React from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ExportExcelButtonProps {
  exportUrl: string;
  defaultFilename?: string;
  label?: string;
  className?: string;
}

export function ExportExcelButton({
  exportUrl,
  defaultFilename = "export.xlsx",
  label = "Export Excel",
  className = "",
}: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const { showToast } = useToast();

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error("Gagal mengunduh file Excel dari server.");
      }

      // Ambil nama file dari header Content-Disposition jika ada
      let filename = defaultFilename;
      const disposition = response.headers.get("Content-Disposition");
      if (disposition && disposition.includes("filename=")) {
        const matches = disposition.match(/filename="?([^"]+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast("Data berhasil diekspor ke Excel (.xlsx).", "success");
    } catch (err) {
      console.error(err);
      showToast(
        err instanceof Error ? err.message : "Terjadi kesalahan saat export Excel.",
        "error"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      title="Unduh seluruh data hasil filter ke file Excel (.xlsx)"
      aria-label="Unduh seluruh data hasil filter ke file Excel"
      className={`inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium rounded-[8px] border transition-colors cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed bg-surface border-line text-text hover:bg-income-soft hover:border-income hover:text-income focus:outline-none focus:ring-2 focus:ring-income/20 ${className}`}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin text-income shrink-0" />
      ) : (
        <FileSpreadsheet className="w-4 h-4 text-income shrink-0" />
      )}
      <span>{isExporting ? "Menyiapkan Excel..." : label}</span>
    </button>
  );
}

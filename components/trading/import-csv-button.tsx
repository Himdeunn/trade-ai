"use client";

import { useState, useRef, useCallback } from "react";
import { importTradesFromFile } from "@/app/actions/import-csv";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImportCSVButtonProps {
  accounts: { id: string; broker: string; accountNumber: string }[];
}

export function ImportCSVButton({ accounts }: ImportCSVButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<{ imported: number; skipped: number; error?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls" && ext !== "txt") {
      toast.error("Invalid file format. Please upload .csv, .xlsx, or .txt");
      return;
    }
    setSelectedFile(file);
    setStatus("idle");
    setResult(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const handleImport = async () => {
    if (!selectedFile || !selectedAccount) return;
    setStatus("loading");
    const toastId = toast.loading("Parsing and importing trades...");
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const res = await importTradesFromFile(selectedAccount, base64, selectedFile.name);
        if (res.success) {
          setStatus("success");
          setResult({ imported: res.imported, skipped: res.skipped });
          toast.success(`Import complete! ${res.imported} trades added.`, { id: toastId });
        } else {
          setStatus("error");
          setResult({ imported: 0, skipped: 0, error: res.error });
          toast.error(res.error || "Import failed", { id: toastId });
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error("Import error:", err);
      setStatus("error");
      setResult({ imported: 0, skipped: 0, error: "An unexpected error occurred." });
      toast.error("An unexpected error occurred", { id: toastId });
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setStatus("idle");
    setResult(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900 transition-all shadow-sm"
      >
        <UploadCloud className="h-4 w-4" />
        Import CSV
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-950 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <UploadCloud className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-black dark:text-white">Import Trade History</h2>
              <p className="text-xs text-zinc-500">MT4/MT5 CSV or TXT format</p>
            </div>
          </div>
          <button onClick={() => { setIsOpen(false); reset(); }} className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Account Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Import to Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.broker} — {acc.accountNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all",
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                : selectedFile
                ? "border-green-400 bg-green-50 dark:bg-green-900/10"
                : "border-zinc-200 dark:border-zinc-800 hover:border-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {selectedFile ? (
              <>
                <FileText className="h-10 w-10 text-green-500" />
                <div className="text-center">
                  <p className="font-bold text-green-700 dark:text-green-400">{selectedFile.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB — Click to change file</p>
                </div>
              </>
            ) : (
              <>
                <UploadCloud className="h-10 w-10 text-zinc-300" />
                <div className="text-center">
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">Drop your CSV or XLSX file here</p>
                  <p className="text-xs text-zinc-400 mt-1">or click to browse — .csv, .xlsx or .txt supported</p>
                </div>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-4 text-xs text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300 mb-2">How to export from MetaTrader:</p>
            <p>1. Open MT5 → Click the <strong>History</strong> tab at the bottom</p>
            <p>2. Right-click → <strong>Save as Report</strong></p>
            <p>3. Save the file (format can be <strong>.xlsx</strong> or <strong>.csv</strong>)</p>
            <p>4. Upload the file here</p>
          </div>

          {/* Result */}
          {status === "success" && result && (
            <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p><strong>{result.imported}</strong> trades imported, <strong>{result.skipped}</strong> skipped (duplicates).</p>
            </div>
          )}
          {status === "error" && result && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>{result.error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => { setIsOpen(false); reset(); }}
              className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-white dark:hover:bg-zinc-900 transition-all"
            >
              {status === "success" ? "Close" : "Cancel"}
            </button>
            {status !== "success" && (
              <button
                onClick={handleImport}
                disabled={!selectedFile || !selectedAccount || status === "loading"}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {status === "loading" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</>
                ) : (
                  <><UploadCloud className="h-4 w-4" /> Import Trades</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

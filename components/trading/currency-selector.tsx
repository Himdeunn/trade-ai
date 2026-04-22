"use client";

import { useState } from "react";
import { updateAccountCurrency } from "@/app/actions/trading";
import { toast } from "sonner";
import { Coins } from "lucide-react";

interface CurrencySelectorProps {
  accountId: string;
  currentCurrency: string;
}

export function CurrencySelector({ accountId, currentCurrency }: CurrencySelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  ];

  const handleUpdate = async (newCurrency: string) => {
    if (newCurrency === currentCurrency) return;
    
    setIsUpdating(true);
    const toastId = toast.loading(`Updating currency to ${newCurrency}...`);
    
    try {
      const res = await updateAccountCurrency(accountId, newCurrency);
      if (res.success) {
        toast.success(`Currency updated to ${newCurrency}`, { id: toastId });
      } else {
        toast.error("Failed to update currency", { id: toastId });
      }
    } catch {
      toast.error("An error occurred", { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Coins className="h-4 w-4 text-zinc-400" />
      <select
        disabled={isUpdating}
        value={currentCurrency}
        onChange={(e) => handleUpdate(e.target.value)}
        className="bg-transparent text-sm font-bold text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer hover:text-blue-600 transition-colors"
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} ({c.symbol})
          </option>
        ))}
      </select>
    </div>
  );
}

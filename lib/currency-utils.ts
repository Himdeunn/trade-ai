export const getCurrencySymbol = (currency: string = "USD") => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    AUD: "A$",
    CAD: "C$",
    IDR: "Rp",
  };
  return symbols[currency] || "$";
};

export const formatCurrency = (value: number, currency: string = "USD") => {
  const symbol = getCurrencySymbol(currency);
  if (currency === "IDR") {
    return `${symbol} ${value.toLocaleString("id-ID")}`;
  }
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

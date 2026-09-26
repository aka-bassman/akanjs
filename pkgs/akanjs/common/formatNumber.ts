export const formatNumber = (numString: string) => {
  if (typeof numString !== "string") {
    numString = String(numString);
  }

  const parts = numString.split(".");
  const integerPart = parts[0]?.replace(/[^\d]/g, "") ?? "";
  const decimalPart = parts.length > 1 ? `.${parts[1]}` : "";

  const formattedInteger = Number(integerPart).toLocaleString("ko-KR");

  return formattedInteger + decimalPart;
};

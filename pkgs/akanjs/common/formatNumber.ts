export const formatNumber = (numString: string) => {
  const [integerPart = "", decimalPart] = String(numString).split(".");
  const formattedInteger = Number(integerPart.replace(/[^\d]/g, "")).toLocaleString("ko-KR");
  return decimalPart === undefined ? formattedInteger : `${formattedInteger}.${decimalPart}`;
};

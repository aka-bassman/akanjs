export const camelToKebabCase = (str: string) => str.replace(/([A-Z])/g, "-$1").toLowerCase();

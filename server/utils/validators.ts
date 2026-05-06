export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPassword = (password: string) => {
  return password && password.length >= 6;
};

export const isNumeric = (val: any) => {
  return !isNaN(parseFloat(val)) && isFinite(val);
};

export const isValidId = (id: any) => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0;
};

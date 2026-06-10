export const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
export const isValidPassword = (password) => {
    return password && password.length >= 6;
};
export const isNumeric = (val) => {
    return !isNaN(parseFloat(val)) && isFinite(val);
};
export const isValidId = (id) => {
    const n = Number(id);
    return Number.isInteger(n) && n > 0;
};
export const isValidHexColor = (color) => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
};

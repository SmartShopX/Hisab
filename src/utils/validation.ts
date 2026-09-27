export const isValidBdMobile = (mobile: string): boolean => {
  const clean = mobile.replace(/[^0-9]/g, '');
  return /^(01[3-9]\d{8}|8801[3-9]\d{8})$/.test(clean);
};

export const isValidEmail = (email: string): boolean => {
  if (!email) return true; // email is optional in many SME setups
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const sanitizeInput = (text: string): string => {
  return text.trim();
};

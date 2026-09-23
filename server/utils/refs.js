const REF_PREFIX = "OBS-";

export const generateReference = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `${REF_PREFIX}${code}`;
};

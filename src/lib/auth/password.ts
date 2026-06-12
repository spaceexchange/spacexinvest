export interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  checks: { length: boolean; upper: boolean; lower: boolean; number: boolean; symbol: boolean };
}

export function evaluatePassword(pw: string): StrengthResult {
  const checks = {
    length: pw.length >= 10,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  let score: 0 | 1 | 2 | 3 | 4 = 0;
  if (passed >= 5 && pw.length >= 14) score = 4;
  else if (passed >= 5) score = 3;
  else if (passed >= 4) score = 2;
  else if (passed >= 2) score = 1;
  const labels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
  return { score, label: labels[score], checks };
}

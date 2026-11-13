export const shadows = {
  subtle: "0px 1px 2px rgba(0, 0, 0, 0.24)",
  raised: "0px 4px 12px rgba(0, 0, 0, 0.36)",
  overlay: "0px 12px 32px rgba(0, 0, 0, 0.48)",
  glow: "0px 4px 16px rgba(229, 9, 20, 0.4)",
  goldGlow: "0px 4px 8px rgba(245, 158, 11, 0.3)",
  successGlow: "0px 8px 16px rgba(6, 40, 30, 0.4)",
  errorGlow: "0px 8px 16px rgba(59, 7, 10, 0.4)",
  card: "0px 4px 20px rgba(0, 0, 0, 0.5)",
  deck: "0px 12px 20px rgba(0, 0, 0, 0.5)",
} as const;

export type ShadowToken = keyof typeof shadows;

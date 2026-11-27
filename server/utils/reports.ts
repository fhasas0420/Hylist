export const REPORT_REASONS = {
    offline: "Always offline / wrong IP",
    wrong_info: "Wrong information",
    inappropriate: "Inappropriate content",
    scam: "Scam or malicious",
    other: "Other",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;

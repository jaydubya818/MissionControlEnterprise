export function requireTelegramOperatorAuthToken(value: string | undefined): string {
  const token = value?.trim();
  if (!token) {
    throw new Error(
      "TELEGRAM_CONVEX_OPERATOR_AUTH_TOKEN is required and must authenticate a mapped Mission Control operator for Telegram approval commands",
    );
  }
  return token;
}

export function telegramApprovalDecision<T extends string>(approvalId: T, reason: string) {
  return { approvalId, reason };
}

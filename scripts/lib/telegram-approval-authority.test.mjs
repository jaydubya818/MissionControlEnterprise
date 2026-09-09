import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  requireTelegramOperatorAuthToken,
  telegramApprovalDecision,
} from "../../packages/telegram-bot/src/approvalAuthority.ts";

describe("Telegram approval authority", () => {
  it("fails closed without an authenticated operator token", () => {
    expect(() => requireTelegramOperatorAuthToken(undefined)).toThrow(
      "must authenticate a mapped Mission Control operator",
    );
  });

  it("does not forward caller-supplied actor identity", () => {
    expect(telegramApprovalDecision("approval-1", "Approved via Telegram")).toEqual({
      approvalId: "approval-1",
      reason: "Approved via Telegram",
    });
  });

  it("keeps one callback handler and no Telegram-supplied approval actor", () => {
    const indexSource = readFileSync("packages/telegram-bot/src/index.ts", "utf8");
    const commandSource = readFileSync("packages/telegram-bot/src/commands/approvals.ts", "utf8");
    expect(indexSource.match(/bot\.on\("callback_query"/g)).toHaveLength(1);
    expect(`${indexSource}\n${commandSource}`).not.toMatch(/decidedBy(?:User|Agent)Id/);
    expect(indexSource).toContain("process.env.TELEGRAM_CONVEX_OPERATOR_AUTH_TOKEN");
  });
});

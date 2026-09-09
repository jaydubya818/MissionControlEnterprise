import { query } from "./_generated/server";
import { RUNTIME_CONTRACT_VERSION } from "./lib/runtimeContract";
import { assertAuthenticated } from "./lib/companyAccess";

/** Stable bootstrap query used before the application mounts normal consumers. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    await assertAuthenticated(ctx);
    return { contractVersion: RUNTIME_CONTRACT_VERSION };
  },
});

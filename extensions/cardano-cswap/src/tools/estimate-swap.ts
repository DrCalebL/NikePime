import { Type } from "@sinclair/typebox";
import type { CswapClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

export function createEstimateSwapTool(client: CswapClient) {
  return {
    label: "CSWAP Estimate Swap",
    name: "cswap_estimate_swap",
    description: "Estimate swap output amount, price impact, and fees.",
    parameters: Type.Object({
      input_token: Type.String({ description: "Input token policy ID (or 'ada')" }),
      output_token: Type.String({ description: "Output token policy ID (or 'ada')" }),
      amount: Type.String({ description: "Input amount (in smallest unit)" }),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const inputToken = readStringParam(params, "input_token");
      const outputToken = readStringParam(params, "output_token");
      const amount = readStringParam(params, "amount");
      if (!inputToken) return jsonResult({ error: "input_token is required" });
      if (!outputToken) return jsonResult({ error: "output_token is required" });
      if (!amount) return jsonResult({ error: "amount is required" });
      const result = await client.estimateSwap(inputToken, outputToken, amount);
      if (!result.ok) return jsonResult({ error: `CSWAP API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}

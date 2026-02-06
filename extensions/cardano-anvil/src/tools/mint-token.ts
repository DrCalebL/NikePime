import { Type } from "@sinclair/typebox";
import type { AnvilClient } from "../client.js";

function jsonResult(data: unknown) {
  return [{ type: "text", text: JSON.stringify(data, null, 2) }];
}
function readStringParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}
function readNumberParam(p: Record<string, unknown>, k: string) {
  const v = p[k];
  return typeof v === "number" ? v : undefined;
}

export function createMintTokenTool(client: AnvilClient) {
  return {
    label: "Anvil Mint Token",
    name: "anvil_mint_token",
    description: "Mint native tokens on Cardano.",
    parameters: Type.Object({
      name: Type.String({ description: "Token name" }),
      quantity: Type.Number({ description: "Number of tokens to mint" }),
      recipient_address: Type.String({ description: "Address to receive minted tokens" }),
      metadata: Type.Optional(Type.Object({}, { description: "Optional metadata JSON" })),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const name = readStringParam(params, "name");
      const quantity = readNumberParam(params, "quantity");
      const recipientAddress = readStringParam(params, "recipient_address");

      if (!name) return jsonResult({ error: "name is required" });
      if (quantity === undefined) return jsonResult({ error: "quantity is required" });
      if (!recipientAddress) return jsonResult({ error: "recipient_address is required" });

      const result = await client.mintToken({
        name,
        quantity,
        recipient_address: recipientAddress,
        metadata: params.metadata as Record<string, unknown> | undefined,
      });
      if (!result.ok) return jsonResult({ error: `Anvil API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}

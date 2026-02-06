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

export function createCollectionTool(client: AnvilClient) {
  return {
    label: "Anvil Create Collection",
    name: "anvil_create_collection",
    description: "Create an NFT collection with royalty settings.",
    parameters: Type.Object({
      name: Type.String({ description: "Collection name" }),
      description: Type.String({ description: "Collection description" }),
      royalty_percentage: Type.Number({ description: "Royalty percentage (0-100)" }),
      royalty_address: Type.String({ description: "Address to receive royalties" }),
    }),
    execute: async (_id: string, args: unknown) => {
      const params = args as Record<string, unknown>;
      const name = readStringParam(params, "name");
      const description = readStringParam(params, "description");
      const royaltyPercentage = readNumberParam(params, "royalty_percentage");
      const royaltyAddress = readStringParam(params, "royalty_address");

      if (!name) return jsonResult({ error: "name is required" });
      if (!description) return jsonResult({ error: "description is required" });
      if (royaltyPercentage === undefined)
        return jsonResult({ error: "royalty_percentage is required" });
      if (royaltyPercentage < 0 || royaltyPercentage > 100)
        return jsonResult({ error: "royalty_percentage must be 0-100" });
      if (!royaltyAddress) return jsonResult({ error: "royalty_address is required" });

      const result = await client.createCollection({
        name,
        description,
        royalty_percentage: royaltyPercentage,
        royalty_address: royaltyAddress,
      });
      if (!result.ok) return jsonResult({ error: `Anvil API: ${result.error}` });
      return jsonResult(result.data);
    },
  };
}

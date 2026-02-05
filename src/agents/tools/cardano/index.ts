/**
 * Cardano ecosystem tools for OpenClaw.
 *
 * Includes:
 * - Blockchain data queries (addresses, transactions, pools, assets)
 * - DeFi integrations (Liqwid Finance, Surge DEX, CSWAP, Metera)
 * - Governance tools (Clarity Protocol, DReps, GovCircle)
 * - Identity resolution (Ada Handle)
 * - Analytics (TapTools, Cexplorer)
 * - Infrastructure (NABU VPN, ADA Anvil)
 * - Proof-of-Inference (Flux Point Studios)
 * - Immutable storage (BEACN Ledger-Scrolls)
 */

export * from "./types.js";
export * from "./client.js";
export * from "./data-tools.js";
export * from "./defi-tools.js";
export * from "./governance-tools.js";
export * from "./poi-tools.js";
export * from "./scrolls-tools.js";
export * from "./taptools.js";
export * from "./cexplorer.js";
export * from "./ada-handle.js";
export * from "./cswap.js";
export * from "./ada-anvil.js";
export * from "./metera.js";
export * from "./govcircle.js";
export * from "./nabu-vpn.js";

import type { OpenClawConfig } from "../../../config/types.js";
import type { AnyAgentTool } from "../common.js";
import { createAdaAnvilTools } from "./ada-anvil.js";
import { createAdaHandleTools } from "./ada-handle.js";
import { createCexplorerTools } from "./cexplorer.js";
import { createCswapTools } from "./cswap.js";
import { createCardanoDataTools } from "./data-tools.js";
import { createDefiTools } from "./defi-tools.js";
import { createGovCircleTools } from "./govcircle.js";
import { createGovernanceTools } from "./governance-tools.js";
import { createMeteraTools } from "./metera.js";
import { createNabuVpnTools } from "./nabu-vpn.js";
import { createPoiTools } from "./poi-tools.js";
import { createScrollsTools } from "./scrolls-tools.js";
import { createTapToolsTools } from "./taptools.js";

/**
 * Create all Cardano ecosystem tools.
 *
 * Returns 40+ tools across categories:
 * - Data & Analytics: TapTools, Cexplorer, core data tools
 * - DeFi: CSWAP, Metera, Liqwid, Surge
 * - Identity: Ada Handle
 * - Governance: GovCircle, Clarity Protocol
 * - Infrastructure: NABU VPN, ADA Anvil
 * - Storage: Ledger-Scrolls
 * - AI: Proof-of-Inference
 */
export function createCardanoTools(cfg?: OpenClawConfig): AnyAgentTool[] {
  const tools = cfg?.tools as Record<string, unknown> | undefined;
  const cardanoConfig = tools?.cardano as Record<string, unknown> | undefined;

  // Check if Cardano tools are enabled (default: true)
  const enabled = cardanoConfig?.enabled !== false;

  if (!enabled) {
    return [];
  }

  return [
    // Core blockchain data
    ...createCardanoDataTools(cfg),
    // Analytics platforms
    ...createTapToolsTools(cfg),
    ...createCexplorerTools(cfg),
    // DeFi protocols
    ...createDefiTools(cfg),
    ...createCswapTools(cfg),
    ...createMeteraTools(cfg),
    // Identity
    ...createAdaHandleTools(cfg),
    // Governance
    ...createGovernanceTools(cfg),
    ...createGovCircleTools(cfg),
    // Infrastructure
    ...createAdaAnvilTools(cfg),
    ...createNabuVpnTools(cfg),
    // Proof-of-Inference
    ...createPoiTools(cfg),
    // Storage
    ...createScrollsTools(cfg),
  ];
}

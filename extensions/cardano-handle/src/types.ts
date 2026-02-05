/**
 * Ada Handle API response types.
 */

export interface ResolvedHandle {
  handle: string;
  address: string;
  policy_id: string;
}

export interface HandleInfo {
  handle: string;
  is_primary: boolean;
}

export interface ReverseResult {
  handles: HandleInfo[];
  primary_handle: string | null;
}

export interface HandleMetadata {
  handle: string;
  rarity: string;
  length: number;
  numeric_modifiers: string | null;
  og: boolean;
  characters: string;
  image: string;
  custom_data: Record<string, unknown>;
}

export interface AvailabilityResult {
  available: boolean;
  handle: string;
  price?: string;
  price_tier?: string;
  owner?: string;
}

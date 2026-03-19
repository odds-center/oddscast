/**
 * Extracted utility functions from KraService for testability.
 */

/**
 * Build race upsert payload with conditional spread for NULL preservation.
 * Only includes nullable fields when they have a value, preventing
 * existing data from being overwritten with NULL on upsert when
 * the current API source lacks the field.
 */
export function buildRaceUpsertPayload(params: {
  meet: string;
  meetName: string | null;
  rcDate: string;
  rcNo: string;
  rcName: string;
  rcDist?: string | null;
  rcDay?: string | null;
  rank?: string | null;
  rcPrize?: number | null;
  stTime?: string | null;
  rcCondition?: string | null;
  weather?: string | null;
  track?: string | null;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}): Record<string, unknown> {
  return {
    meet: params.meet,
    meetName: params.meetName ?? null,
    rcDate: params.rcDate,
    rcNo: params.rcNo,
    rcName: params.rcName,
    ...(params.rcDist != null && { rcDist: params.rcDist }),
    ...(params.rcDay != null && { rcDay: params.rcDay }),
    ...(params.rank != null && { rank: params.rank }),
    ...(params.rcPrize != null && { rcPrize: params.rcPrize }),
    ...(params.stTime != null && { stTime: params.stTime }),
    ...(params.rcCondition != null && { rcCondition: params.rcCondition }),
    ...(params.weather != null && { weather: params.weather }),
    ...(params.track != null && { track: params.track }),
    ...(params.status != null && { status: params.status }),
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
  };
}

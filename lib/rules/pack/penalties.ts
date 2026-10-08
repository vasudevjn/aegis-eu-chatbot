import type { Cite, FineTier } from "@/lib/rules/types";
import { act, omni } from "@/lib/rules/pack/cite";

/** Maximum administrative fines (Article 99, as amended, and Article 101). Page numbers are OJ 2024/1689 unless marked. */
export interface FineInfo {
  tier: FineTier;
  /** Plain-language maximum. */
  max: string;
  /** A rough ordering, higher is more serious. */
  rank: number;
  cites: Cite[];
}

export const FINES: Record<FineTier, FineInfo> = {
  art5: {
    tier: "art5", rank: 4,
    max: "up to EUR 35 million or 7% of total worldwide annual turnover, whichever is higher",
    cites: [act("Art. 99(3)", 99, 115)],
  },
  art99_4: {
    tier: "art99_4", rank: 3,
    max: "up to EUR 15 million or 3% of total worldwide annual turnover, whichever is higher",
    cites: [act("Art. 99(4)", 99, 115), omni("Art. 99(4)(da)", 35)],
  },
  gpai: {
    tier: "gpai", rank: 3,
    max: "up to EUR 15 million or 3% of total worldwide annual turnover, whichever is higher, imposed by the Commission from 2 August 2026",
    cites: [act("Art. 101", 101, 117)],
  },
  art99_5: {
    tier: "art99_5", rank: 2,
    max: "up to EUR 7.5 million or 1% of total worldwide annual turnover, whichever is higher, for supplying incorrect, incomplete or misleading information to authorities",
    cites: [act("Art. 99(5)", 99, 116)],
  },
  member_state: {
    tier: "member_state", rank: 1,
    max: "set by each Member State's penalty rules (no fixed ceiling is listed for this duty in the Act)",
    cites: [act("Art. 99(1)", 99, 115), omni("Art. 99(1)", 35)],
  },
};

export const SME_FINE_NOTE =
  "For SMEs (including start-ups) and small mid-caps, each fine is capped at the lower of the percentage and the amount.";
export const SME_FINE_CITES: Cite[] = [act("Art. 99(6)", 99, 116), omni("Art. 99(6a)", 35)];
export const INCORRECT_INFO_NOTE = FINES.art99_5.max;

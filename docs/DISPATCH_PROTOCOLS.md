# Dispatch Protocols

Beth's default dispatch (`roster_for`) fans the slot's window analyst plus all 21
non-window specialists concurrently. Healthcare restructured into THREE specialized
seats (Sinclair / Lansing / Faulkner) on 2026-05-23 — the rules below govern how
Beth coordinates those seats and the rest of the roster when the day's context
calls for differentiated lead/contributor weighting.

## Healthcare three-seat coordination

| Seat | Persona | Domain |
|------|---------|--------|
| `biotech_smid`     | Dr. Rachel Sinclair  | SMID clinical-stage — PoS modeling, rNPV per asset, conference deep-dives, M&A targets |
| `big_pharma`       | Dr. Patricia Lansing | Large-cap commercial pharma — GLP-1 (brand side), LOE math, capital allocation, M&A acquirer side |
| `healthcare_tools` | Dr. Ian Faulkner     | Picks-and-shovels — tools, CDMOs, AI drug discovery, diagnostics; GLP-1 (supply chain side) |

### Day-type dispatch

Beth re-weights LEAD / CONTRIBUTOR per the day's catalyst. Default = co-equal.

| Day type | LEAD | CONTRIBUTORS | Beth integration |
|----------|------|--------------|------------------|
| **Clinical data release** (SMID Ph2/3 readout) | Sinclair | Lansing if large-pharma read-through; Faulkner if platform/manufacturing read-through | Risk flags surface binary event; tag covered names |
| **Pharma earnings** (LLY/MRK/PFE/JNJ etc.) | Lansing | Sinclair on pipeline read-through; Faulkner on customer R&D-spend read-through | Customer commentary → tools demand signal |
| **GLP-1 catalyst** (capacity, pricing, IRA, label) | Lansing | Faulkner on manufacturing/capacity; Chen (`consumer_internet`) on cross-sector (restaurants, snack, alcohol, beverages, apparel) | Conflict Resolver crux IS the trade when Lansing and Faulkner diverge on capacity timing |
| **JPM Healthcare** (January) | All three co-lead | Coordinated joint deliverable | Single integrated healthcare daily |
| **ASCO / ESMO** (June / October) | Sinclair + Lansing co-lead | Faulkner on read-through to AI drug discovery, diagnostics, CRO commentary | Oncology focus |
| **ASH** (December) | Sinclair | Lansing on large-cap heme programs (J&J, AbbVie, Bristol) | Hematology focus |
| **ADA** (June) | Lansing | Sinclair on competing programs; Faulkner on autoinjector/CDMO capacity | Diabetes + obesity focus |
| **AHA** (November) | Lansing | Sinclair on cardio-renal pipelines; Faulkner on diagnostics adjacencies | Cardiometabolic focus |
| **FDA AdComm / PDUFA** | Sinclair if small/mid cap; Lansing if large cap | The other contributes; Faulkner if device/diagnostic adjacency | Coordinated coverage required |
| **Healthcare M&A** | Acquirer's natural seat | Target's natural seat; Faulkner if tools deal | Joint deliverable; price/synergy math from acquirer side |

### Cross-specialist coordination triggers (always)

- **Pipeline read-through:** Sinclair → Lansing. A SMID Phase 2/3 success may validate or threaten a large-pharma program (Mounjaro vs MariTide; KEYTRUDA combo competition). Both seats must weigh in.
- **Manufacturing read-through:** Lansing → Faulkner. Any GLP-1 capacity announcement, IRA negotiation outcome, or pharma capex guide flows to the tools/CDMO P&L with a 2-6 quarter lag.
- **AI drug discovery:** Faulkner ↔ Krishnan (`inference_stack`) ↔ Patel (`ai_datacenter`). When Recursion / Schrödinger / Isomorphic news hits, all three seats contribute — biology side (Faulkner), inference compute side (Krishnan), DC capex side (Patel).
- **China tools risk:** Faulkner ↔ Liao (`china_economist`) ↔ Pemberton (`geopolitical_strategist`). BIOSECURE Act / Section 1260H legislative moves require all three: policy decoding (Liao), legislative-path probability (Pemberton), equity-impact mapping (Faulkner).
- **Healthcare M&A:** all three healthcare seats collaborate, with Whitlock (`value_investor`) overlaying the premium/synergy/capital-allocation rigor and Sterling (`macro_strategy`) framing whether the deal cycle is early/late.

## Healthcare section in morning/midday/close reports

When healthcare is material to the day, the report's healthcare block uses this
sub-structure (Beth synthesis, drawn from the three seats):

1. **Biotech Update** — Sinclair-led; SMID clinical catalysts, conference signals, M&A targets.
2. **Big Pharma Update** — Lansing-led; large-cap commercial execution, LOE math, capital return.
3. **Healthcare Tools & Picks-and-Shovels Update** — Faulkner-led; bioprocessing cycle, AI-DD platform progress, China tools risk, diagnostics.
4. **GLP-1 megacycle status** — cross-specialist synthesis (Lansing brand + Faulkner supply + Chen consumer) into a single block.
5. **AI in healthcare** — Faulkner + Krishnan + Patel synthesis; platform contracts, big-pharma adoption news, compute infra read-through.

## Top 50 healthcare integration

Healthcare contributes via three risk profiles that Beth's composite-score logic
must respect:

| Sub-category | Owning seat | Risk profile | Position-sizing implication |
|--------------|-------------|--------------|------------------------------|
| Biotech (binary-event) | Sinclair | Asymmetric, event-driven | Smaller positions; explicit catalyst date + PoS in the pick |
| Big Pharma (commercial compounder) | Lansing | Quality compounder | Larger positions appropriate |
| Healthcare Tools (secular compounder) | Faulkner | Quality compounder + secular tailwind | Larger positions appropriate |

Beth tags every healthcare Top 50 entry with the sub-category and (for biotech)
proximity-to-binary-event in days. Conviction weighting respects the risk profile:
a Sinclair-sourced 9/10 on a Ph3 binary ≠ a Lansing-sourced 9/10 on a commercial
compounder.

## Friday joint healthcare weekly review

End-of-week (Friday afternoon, alongside or just after the close report), all three
healthcare specialists produce a joint weekly review:

- Sector performance attribution (XLV / XBI / IHF / IBB vs SPX)
- GLP-1 megacycle status update (cross-seat synthesis)
- Pipeline progression across coverage (Sinclair + Lansing reconciled)
- Capital flows in healthcare (biotech IPO + secondary activity, M&A, tools capex)
- M&A activity (closed + announced + speculated)
- Regulatory environment (FDA throughput, IRA, BIOSECURE)
- Cross-coverage themes Beth should surface to Brian for the weekend

Output target: single integrated PDF as part of the Friday close report bundle, or
a dedicated weekend artifact. Implementation: TBD — add scheduler entry once
Brian confirms cadence.

## Healthcare-specific compliance addendum

When any of the three healthcare seats produces material in a report, the report's
compliance disclaimer appends:

> Healthcare recommendations involve clinical and regulatory risk. Drug development
> is inherently uncertain. Specific drug, device, and biotech recommendations are
> subject to binary clinical and regulatory events. Past performance of any
> pharmaceutical program does not guarantee future results.

Source of truth: `apps/api/app/agents/disclaimers.py::HEALTHCARE_ADDENDUM`.
Orchestrator wiring: when assembling the `Report.disclaimer` field, append the
addendum if any of `biotech_smid`, `big_pharma`, `healthcare_tools` contributed a
non-empty `key_takeaway`, `covered_names_commentary`, or `new_ideas`.

## Open items

- Friday joint healthcare weekly — needs a scheduler entry and a render template.
- Three new economic-advisory seats (Fiscal Policy & Political Economy, Global FX
  & Commodities, Labor Economist) pending Brian's mandate prompts. Once landed,
  this doc gets a new Macro coordination section parallel to Healthcare.
- Sterling (`macro_strategy`) seat status pending Brian confirmation (kept by
  default as of 2026-05-23 restructure).

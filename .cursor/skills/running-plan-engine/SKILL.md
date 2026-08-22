---
name: running-plan-engine
description: Running plan engine rules for Berun. Use when modifying plan generation, progression, ACWR, long-run caps, pain gates, detraining, or reconcile logic.
---

# Running Plan Engine

## Load currency

- Primary: minutes and sRPE (minutes × RPE)
- km for display and long-run cap only

## Hard rules

- Block: 3 build weeks + 1 recovery (70–80% of block peak)
- Progression rate: 5% / 10% / 15% of weekly minutes (default 10%)
- Long run: max +10% vs longest in 30 days; max 30% (beginner) / 35% (regular) of weekly minutes
- No volume + intensity increase same week
- Polarized target: ≥80% easy minutes

## Advisory only

- EWMA ACWR (acute N=7, chronic N=28), show only after 28 days data
- Never auto-cut volume based on ACWR alone

## Pain gate

- pain ≥3 same location 2 sessions → 30% deload + no quality
- pain ≥6 or alters gait → stop recommendation, block quality until 3 pain-free sessions

## Detraining

- 7–13 days off → next week 80% of avg 4 weeks before gap
- 14–20 days → 70%, restart block
- ≥21 days → re-baseline via onboarding
- Never carry missed load forward

## Reconcile

- Next week from actual last 3 weeks (weighted), not planned numbers
- New PlanVersion on regenerate; never mutate old versions

export const HoldsAir = {
  Yes: 'yes',
  No: 'no',
  NotTested: 'not-tested',
} as const;

export type HoldsAir = (typeof HoldsAir)[keyof typeof HoldsAir];

export const ReadyStatus = {
  Yes: 'yes',
  YesIfRepaired: 'yes-if-repaired',
  No: 'no',
  NotAssessed: 'not-assessed',
} as const;

export type ReadyStatus = (typeof ReadyStatus)[keyof typeof ReadyStatus];

export const LineCondition = {
  Good: 'good',
  Damaged: 'damaged',
  NotAssessed: 'not-assessed',
} as const;

export type LineCondition = (typeof LineCondition)[keyof typeof LineCondition];

export const DRingCondition = {
  Good: 'good',
  Damaged: 'damaged',
  NotAssessed: 'not-assessed',
} as const;

export type DRingCondition = (typeof DRingCondition)[keyof typeof DRingCondition];

export const PhotoParentType = {
  Piece: 'piece',
  Anchor: 'anchor',
  DRing: 'd-ring',
  AirPressure: 'air-pressure',
  Readiness: 'readiness',
} as const;

export type PhotoParentType = (typeof PhotoParentType)[keyof typeof PhotoParentType];

export const PhotoCategory = {
  General: 'general',
  Serial: 'serial',
  Damage: 'damage',
  Anchor: 'anchor',
  DRing: 'd-ring',
  AirPressure: 'air-pressure',
  Readiness: 'readiness',
} as const;

export type PhotoCategory = (typeof PhotoCategory)[keyof typeof PhotoCategory];

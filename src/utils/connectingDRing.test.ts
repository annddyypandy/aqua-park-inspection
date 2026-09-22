import { describe, expect, it } from 'vitest';
import { DRingCondition } from '../models';
import { foldConnectingDRingFromAnchors } from './connectingDRing';

describe('foldConnectingDRingFromAnchors', () => {
  it('prefers damaged over good and joins notes', () => {
    expect(
      foldConnectingDRingFromAnchors([
        { connectingDRingCondition: DRingCondition.Good, connectingDRingNotes: 'Ok' },
        { connectingDRingCondition: DRingCondition.Damaged, connectingDRingNotes: 'Bent' },
      ]),
    ).toEqual({
      connectingDRingCondition: DRingCondition.Damaged,
      connectingDRingNotes: 'Ok Bent',
    });
  });

  it('treats missing answers as not assessed', () => {
    expect(foldConnectingDRingFromAnchors([])).toEqual({
      connectingDRingCondition: DRingCondition.NotAssessed,
      connectingDRingNotes: '',
    });
  });
});

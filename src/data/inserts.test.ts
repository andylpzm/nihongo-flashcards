import { describe, it, expect } from 'vitest';
import { applyInserts, type CardInsert } from './inserts';
import type { GallerySaga } from '../srs/gallery';

const piece = (id: string) => ({
  id, kind: 'chapter', chapter: 1, volume: 1,
  image: `gallery/${id}.jpg`, thumb: `gallery/t/${id}.jpg`,
});

const sagas = (): GallerySaga[] => [{
  id: 'first', saga: 'First',
  arcs: [
    { id: 'arc-a', arc: 'A', payoff: null, pieces: [piece('ch-001'), piece('ch-002')] },
    { id: 'arc-b', arc: 'B', payoff: null, pieces: [piece('ch-003')] },
  ],
}];

const ins = (over: Partial<CardInsert> = {}): CardInsert => ({
  id: 'ins-001', arc: 'arc-a', after: 'ch-001', kind: 'chapter',
  image: 'gallery/ins-001.jpg', thumb: 'gallery/t/ins-001.jpg', ...over,
});

const ids = (out: GallerySaga[], arc = 0) => out[0]!.arcs[arc]!.pieces.map((p) => p.id);

describe('applyInserts', () => {
  it('puts a card behind the one it names', () => {
    expect(ids(applyInserts(sagas(), [ins()]))).toEqual(['ch-001', 'ins-001', 'ch-002']);
  });

  it('puts it first when it names nothing', () => {
    expect(ids(applyInserts(sagas(), [ins({ after: null })]))).toEqual(['ins-001', 'ch-001', 'ch-002']);
  });

  it('puts it last when it names the arc itself - the payoff sits behind every piece', () => {
    expect(ids(applyInserts(sagas(), [ins({ after: 'arc-a' })]))).toEqual(['ch-001', 'ch-002', 'ins-001']);
  });

  it('keeps a card whose anchor has gone, at the end of its arc', () => {
    expect(ids(applyInserts(sagas(), [ins({ after: 'ch-999' })]))).toEqual(['ch-001', 'ch-002', 'ins-001']);
  });

  it('chains - a card can sit behind one inserted before it', () => {
    const out = applyInserts(sagas(), [ins(), ins({ id: 'ins-002', after: 'ins-001' })]);
    expect(ids(out)).toEqual(['ch-001', 'ins-001', 'ins-002', 'ch-002']);
  });

  it('leaves other arcs alone', () => {
    expect(ids(applyInserts(sagas(), [ins()]), 1)).toEqual(['ch-003']);
  });

  it('drops an insert for an arc that no longer exists', () => {
    expect(ids(applyInserts(sagas(), [ins({ arc: 'arc-gone' })]))).toEqual(['ch-001', 'ch-002']);
  });

  it('never applies the same id twice', () => {
    const out = applyInserts(sagas(), [ins(), ins()]);
    expect(ids(out)).toEqual(['ch-001', 'ins-001', 'ch-002']);
  });

  it('does not touch what it was given - the manifest is a shared module object', () => {
    const before = sagas();
    applyInserts(before, [ins()]);
    expect(ids(before)).toEqual(['ch-001', 'ch-002']);
  });
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// the tilt preference and the state it reports. the state matters more than it
// looks: "you declined and ios will not ask again this visit" has to be
// distinguishable from "off", or the settings row offers a button that
// silently does nothing.

async function fresh(): Promise<typeof import('./motion')> {
  vi.resetModules();
  return import('./motion');
}

const withoutApi = (): void => {
  // jsdom has no DeviceOrientationEvent unless something defines it
  delete (window as unknown as Record<string, unknown>).DeviceOrientationEvent;
};

const withApi = (requestPermission?: () => Promise<string>): void => {
  const ctor = function () {} as unknown as Record<string, unknown>;
  if (requestPermission) ctor.requestPermission = requestPermission;
  (window as unknown as Record<string, unknown>).DeviceOrientationEvent = ctor;
};

describe('tilt preference', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(withoutApi);

  it('is on until it is turned off', async () => {
    withApi();
    const m = await fresh();
    expect(m.motionEnabled()).toBe(true);
    m.setMotionEnabled(false);
    expect(m.motionEnabled()).toBe(false);
    m.setMotionEnabled(true);
    expect(m.motionEnabled()).toBe(true);
  });

  it('says unsupported when the device has no sensor at all', async () => {
    withoutApi();
    const m = await fresh();
    expect(m.motionState()).toBe('unsupported');
  });

  it('reports off ahead of anything else, so the row reads as the user set it', async () => {
    withApi();
    const m = await fresh();
    m.setMotionEnabled(false);
    expect(m.motionState()).toBe('off');
  });

  it('goes live once permission is granted', async () => {
    withApi(async () => 'granted');
    const m = await fresh();
    expect(m.motionState()).toBe('asking');
    expect(await m.requestMotion()).toBe(true);
    expect(m.motionState()).toBe('live');
  });

  it('remembers a refusal, which is what the settings row exists for', async () => {
    withApi(async () => 'denied');
    const m = await fresh();
    expect(await m.requestMotion()).toBe(false);
    expect(m.motionState()).toBe('denied');
  });

  it('treats a thrown request as a refusal rather than crashing the sheet', async () => {
    withApi(() => Promise.reject(new Error('needs a user gesture')));
    const m = await fresh();
    expect(await m.requestMotion()).toBe(false);
    expect(m.motionState()).toBe('denied');
  });

  it('does not ask at all while the preference is off', async () => {
    const ask = vi.fn(async () => 'granted');
    withApi(ask);
    const m = await fresh();
    m.setMotionEnabled(false);
    expect(await m.requestMotion()).toBe(false);
    expect(ask).not.toHaveBeenCalled();
  });
});

export const TIME_CONTEXT_EVENTS = {
  //old API events - to be deprecated
  bounds: 'bounds',
  clock: 'clock',
  timeSystem: 'timeSystem',
  clockOffsets: 'clockOffsets',
  //new API events
  tick: 'tick',
  modeChanged: 'modeChanged',
  boundsChanged: 'boundsChanged',
  clockChanged: 'clockChanged',
  timeSystemChanged: 'timeSystemChanged',
  clockOffsetsChanged: 'clockOffsetsChanged'
};

export const REALTIME_MODE_KEY = 'realtime';
export const FIXED_MODE_KEY = 'fixed';

export const MODES = {
  [FIXED_MODE_KEY]: FIXED_MODE_KEY,
  [REALTIME_MODE_KEY]: REALTIME_MODE_KEY
};

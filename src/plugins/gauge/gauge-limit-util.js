const GAUGE_LIMITS = {
  q1: 0,
  q2: 90,
  q3: 180,
  q4: 270
};

export const DIAL_VALUE_DEG_OFFSET = 45;

// type: low, high
// quadrant: low, mid, high, max
export function getLimitDegree(type, quadrant) {
  if (quadrant === 'max') {
    return GAUGE_LIMITS.q4 + DIAL_VALUE_DEG_OFFSET;
  }

  return type === 'low' ? getLowLimitDegree(quadrant) : getHighLimitDegree(quadrant);
}

function getLowLimitDegree(quadrant) {
  return GAUGE_LIMITS[quadrant] + DIAL_VALUE_DEG_OFFSET;
}

function getHighLimitDegree(quadrant) {
  if (quadrant === 'q1') {
    return GAUGE_LIMITS.q4 + DIAL_VALUE_DEG_OFFSET;
  }

  if (quadrant === 'q2') {
    return GAUGE_LIMITS.q3 + DIAL_VALUE_DEG_OFFSET;
  }

  if (quadrant === 'q3') {
    return GAUGE_LIMITS.q2 + DIAL_VALUE_DEG_OFFSET;
  }
}

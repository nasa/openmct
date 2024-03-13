const PI = Math.PI; // Use the built-in constant directly
const DEGREES_TO_RADIANS = PI / 180; // Calculate the conversion factor

import { arc } from 'd3-shape';

const SVG_VB_SIZE = 100;
const UPDATE_RATE_MS = 1000; // 1 Hz

function progToDegrees(progVal) {
  return (progVal / 100) * 360;
}

function renderProgress(progressPercent, element) {
  let startAngleInDegrees = 0;
  let endAngleInDegrees = progToDegrees(progressPercent);

  // Convert angles to radians for calculations
  const startAngleInRadians = startAngleInDegrees * DEGREES_TO_RADIANS;
  const endAngleInRadians = endAngleInDegrees * DEGREES_TO_RADIANS;

  // d3's arc API does the work for us
  const progressArc = arc();
  progressArc.innerRadius(0);
  progressArc.outerRadius(SVG_VB_SIZE / 2);
  progressArc.startAngle(startAngleInRadians);
  progressArc.endAngle(endAngleInRadians);
  element.setAttribute('d', progressArc());
}

export function updateProgress(start, end, timestamp, element) {
  const duration = end - start;
  const update_per_cycle = 100 / (duration / UPDATE_RATE_MS);
  let progressPercent = 0;
  if (timestamp > start) {
    // Now is after activity start datetime
    if (timestamp > end) {
      progressPercent = 100;
    } else {
      progressPercent = (1 - (end - timestamp) / duration) * 100;
    }
  }
  if (progressPercent < 100 && progressPercent > 0) {
    // If the remaining percent is less than update_per_cycle, round up to 100%.
    // Otherwise, increment by update_per_cycle.
    progressPercent =
      100 - progressPercent < update_per_cycle ? 100 : (progressPercent += update_per_cycle);
  }
  renderProgress(progressPercent, element);
}

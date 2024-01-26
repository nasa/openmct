/************** https://marian-caikovski.medium.com/drawing-sectors-and-pie-charts-with-svg-paths-b99b5b6bf7bd */
function getD(radius, startAngle, endAngle) {
  const isCircle = endAngle - startAngle === 360;
  if (isCircle) {
    endAngle--;
  }
  const start = polarToCartesian(radius, startAngle);
  const end = polarToCartesian(radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  const d = ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y];
  if (isCircle) {
    d.push('Z');
  } else {
    d.push('L', radius, radius, 'L', start.x, start.y, 'Z');
  }
  const o = d.join(' ');
  return o;
}

function polarToCartesian(radius, angleInDegrees) {
  let radians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: round(radius + radius * Math.cos(radians)),
    y: round(radius + radius * Math.sin(radians))
  };
}

function round(n) {
  return Math.round(n * 10) / 10;
}

/************************************************************************* CHARLES STUFF */
const SVG_VB_SIZE = 100;
const UPDATE_RATE_MS = 1000; // 1 Hz

function progToDegrees(progVal) {
  return (progVal / 100) * 360;
}

function renderProgress(progressPercent, element) {
  element.setAttribute('d', getD(SVG_VB_SIZE / 2, 0, progToDegrees(progressPercent)));
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
  if (progressPercent < 100) {
    // If the remaining percent is less than update_per_cycle, round up to 100%.
    // Otherwise, increment by update_per_cycle.
    progressPercent =
      100 - progressPercent < update_per_cycle ? 100 : (progressPercent += update_per_cycle);
  }
  renderProgress(progressPercent, element);
}

/**
 * Orbital View Provider
 *
 * Registers a custom "Ground Track" view for satellite objects in OpenMCT.
 * Renders a 2D equirectangular world map with real-time satellite position,
 * ground track, and orbital footprint using HTML Canvas.
 */

export default class OrbitalViewProvider {
  constructor(dataService) {
    this._dataService = dataService;
  }

  key() {
    return 'orbital.groundtrack';
  }

  name() {
    return 'Ground Track';
  }

  cssClass() {
    return 'icon-telemetry';
  }

  canView(domainObject) {
    return domainObject.type === 'orbital.satellite';
  }

  view(domainObject) {
    const dataService = this._dataService;
    let canvas;
    let ctx;
    let container;
    let animFrame;
    let unsubscribe;
    let currentPosition = null;
    let groundTrack = [];

    return {
      show(element) {
        container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.position = 'relative';
        container.style.backgroundColor = '#0a1628';
        element.appendChild(container);

        canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);

        const satId = domainObject.identifier.key;
        const sat = dataService.getSatellite(satId);

        // Compute initial ground track (1 orbit)
        groundTrack = dataService.computeGroundTrack(satId, new Date(), 1.5, 120);
        currentPosition = dataService.computePosition(satId);

        // Subscribe to real-time updates
        unsubscribe = dataService.subscribe(satId, (telemetry) => {
          currentPosition = telemetry;
        });

        // Start render loop
        const render = () => {
          drawMap(canvas, ctx, currentPosition, groundTrack, sat);
          animFrame = requestAnimationFrame(render);
        };

        const resizeObserver = new ResizeObserver(() => {
          canvas.width = container.clientWidth * (window.devicePixelRatio || 1);
          canvas.height = container.clientHeight * (window.devicePixelRatio || 1);
          ctx = canvas.getContext('2d');
          ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        });

        resizeObserver.observe(container);
        canvas.width = container.clientWidth * (window.devicePixelRatio || 1);
        canvas.height = container.clientHeight * (window.devicePixelRatio || 1);
        ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

        render();

        // Refresh ground track every 30 seconds
        this._trackInterval = setInterval(() => {
          groundTrack = dataService.computeGroundTrack(satId, new Date(), 1.5, 120);
        }, 30000);
      },

      destroy() {
        if (animFrame) {
          cancelAnimationFrame(animFrame);
        }

        if (unsubscribe) {
          unsubscribe();
        }

        if (this._trackInterval) {
          clearInterval(this._trackInterval);
        }

        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    };
  }

  priority() {
    return 1;
  }
}

function lonLatToXY(lon, lat, width, height) {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;

  return { x, y };
}

function drawMap(canvas, ctx, position, groundTrack, sat) {
  if (!ctx) {
    return;
  }

  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);

  // Clear
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, w, h);

  // Draw grid lines
  ctx.strokeStyle = 'rgba(60, 80, 120, 0.3)';
  ctx.lineWidth = 0.5;

  for (let lon = -180; lon <= 180; lon += 30) {
    const { x } = lonLatToXY(lon, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  for (let lat = -90; lat <= 90; lat += 30) {
    const { y } = lonLatToXY(0, lat, w, h);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw equator
  ctx.strokeStyle = 'rgba(60, 80, 120, 0.6)';
  ctx.lineWidth = 1;
  const { y: eqY } = lonLatToXY(0, 0, w, h);
  ctx.beginPath();
  ctx.moveTo(0, eqY);
  ctx.lineTo(w, eqY);
  ctx.stroke();

  // Draw simplified coastlines (major continent outlines)
  drawCoastlines(ctx, w, h);

  // Draw ground track
  if (groundTrack.length > 1) {
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.4)';
    ctx.lineWidth = 1.5;

    let prevPoint = null;

    for (const point of groundTrack) {
      const { x, y } = lonLatToXY(point.longitude, point.latitude, w, h);

      if (prevPoint) {
        // Don't draw line across the map wrap
        const dx = Math.abs(x - prevPoint.x);

        if (dx < w * 0.5) {
          ctx.beginPath();
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }

      prevPoint = { x, y };
    }
  }

  // Draw satellite position
  if (position) {
    const { x, y } = lonLatToXY(position.longitude, position.latitude, w, h);

    // Satellite footprint circle (approximate)
    const footprintRadius = Math.max(10, (position.altitude / 2000) * Math.min(w, h) * 0.05);
    ctx.fillStyle = 'rgba(0, 200, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(x, y, footprintRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, footprintRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Satellite dot
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Satellite label
    const name = sat ? sat.name : 'Unknown';
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText(name, x + 10, y - 10);

    // Telemetry info
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    ctx.font = '11px monospace';
    const info = [
      `LAT: ${position.latitude.toFixed(2)}°`,
      `LON: ${position.longitude.toFixed(2)}°`,
      `ALT: ${position.altitude.toFixed(0)} km`,
      `SPD: ${position.speed.toFixed(2)} km/s`
    ];
    info.forEach((line, i) => {
      ctx.fillText(line, x + 10, y + 5 + i * 14);
    });
  }

  // Map border
  ctx.strokeStyle = 'rgba(60, 80, 120, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, w, h);
}

/**
 * Draw simplified continent outlines for the world map.
 * These are approximate polygon coordinates for major landmasses.
 */
function drawCoastlines(ctx, w, h) {
  ctx.strokeStyle = 'rgba(40, 120, 80, 0.5)';
  ctx.fillStyle = 'rgba(30, 80, 50, 0.15)';
  ctx.lineWidth = 0.8;

  const continents = [
    // North America (simplified)
    [
      [-130, 50], [-125, 60], [-110, 65], [-90, 70], [-80, 70], [-65, 60],
      [-75, 45], [-80, 30], [-90, 30], [-105, 25], [-115, 30], [-125, 40], [-130, 50]
    ],
    // South America
    [
      [-80, 10], [-75, 5], [-60, 5], [-50, 0], [-35, -5], [-40, -20],
      [-50, -25], [-55, -35], [-65, -45], [-70, -55], [-75, -45], [-70, -20],
      [-75, -5], [-80, 0], [-80, 10]
    ],
    // Europe
    [
      [-10, 40], [0, 45], [5, 50], [10, 55], [20, 55], [30, 60],
      [40, 65], [40, 55], [30, 45], [25, 40], [15, 38], [5, 38], [-10, 40]
    ],
    // Africa
    [
      [-15, 30], [-15, 15], [-5, 5], [10, 5], [15, -5], [30, -10],
      [40, -15], [35, -25], [25, -35], [20, -30], [15, -20], [10, -5],
      [0, 5], [-10, 5], [-15, 15], [-15, 30]
    ],
    // Asia (simplified)
    [
      [40, 40], [50, 45], [60, 50], [70, 55], [80, 55], [90, 50],
      [100, 55], [110, 50], [120, 50], [130, 45], [140, 45], [145, 50],
      [140, 55], [130, 55], [120, 60], [100, 65], [80, 70], [60, 70],
      [50, 60], [40, 55], [30, 45], [40, 40]
    ],
    // Australia
    [
      [115, -15], [130, -12], [140, -12], [150, -20], [150, -30],
      [145, -38], [135, -35], [125, -30], [115, -25], [115, -15]
    ]
  ];

  for (const coords of continents) {
    ctx.beginPath();
    const first = lonLatToXY(coords[0][0], coords[0][1], w, h);
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < coords.length; i++) {
      const { x, y } = lonLatToXY(coords[i][0], coords[i][1], w, h);
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

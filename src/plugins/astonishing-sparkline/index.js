// Astonishing Sparkline plugin for Open MCT
// Drop under: src/plugins/astonishing-sparkline/index.js
export default function astonishingSparkline(options = {}) {
  const maxSamples = options.maxSamples || 300;
  const bgColor = options.bgColor || '#0b1020';
  const lineColor = options.lineColor || '#00e0a3';
  const lineWidth = options.lineWidth || 2;

  return function install(openmct) {
    openmct.objectViews.addProvider({
      key: 'astonishing.sparkline',
      name: 'Astonishing Sparkline',
      canView(domainObject) {
        // Show for objects with telemetry (best-effort): adapt if your Open MCT version exposes a different API.
        try {
          const metadata = openmct.telemetry.getMetadata(domainObject);
          return !!(metadata && metadata.values && metadata.values.length > 0);
        } catch (e) {
          // getMetadata may not exist in some versions — fallback: allow viewing and hope subscribe works.
          return true;
        }
      },
      view(domainObject) {
        let containerEl = null;
        let canvas = null;
        let ctx = null;
        let buffer = [];
        let raf = null;
        let unsubscribe = null;
        let dpr = 1;

        function resizeCanvas() {
          if (!canvas || !containerEl) return;
          const rect = containerEl.getBoundingClientRect();
          dpr = window.devicePixelRatio || 1;
          canvas.width = Math.max(2, Math.floor(rect.width * dpr));
          canvas.height = Math.max(2, Math.floor(rect.height * dpr));
          canvas.style.width = rect.width + 'px';
          canvas.style.height = rect.height + 'px';
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function pushSample(v) {
          if (typeof v !== 'number' || !isFinite(v)) return;
          buffer.push(v);
          if (buffer.length > maxSamples) buffer.shift();
        }

        function telemetryCallback(sample) {
          // sample may be an object with multiple fields. Choose first numeric value we find.
          if (Array.isArray(sample)) {
            sample = sample[0];
          }
          if (typeof sample === 'object') {
            for (const k in sample) {
              const v = sample[k];
              if (typeof v === 'number' && isFinite(v)) {
                pushSample(v);
                break;
              }
            }
          } else if (typeof sample === 'number') {
            pushSample(sample);
          }
        }

        function render() {
          if (!ctx || !canvas) return;
          const w = canvas.width / dpr;
          const h = canvas.height / dpr;
          // clear + background
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, w, h);

          if (buffer.length < 2) {
            // subtle pulse when not enough data
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.fillRect(0, 0, w, h);
            return;
          }

          // compute min/max with small padding
          let min = Infinity, max = -Infinity;
          for (let i = 0; i < buffer.length; i++) {
            const v = buffer[i];
            if (v < min) min = v;
            if (v > max) max = v;
          }
          if (min === max) {
            min = min - 1;
            max = max + 1;
          }
          const range = max - min;

          // background gradient
          const grad = ctx.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, 'rgba(0,240,163,0.06)');
          grad.addColorStop(1, 'rgba(0,0,0,0.0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // draw line
          ctx.beginPath();
          const step = w / (maxSamples - 1 || (buffer.length - 1));
          let x = 0;
          // draw only the last buffer.length samples positioned to the right
          const offset = Math.max(0, maxSamples - buffer.length);
          for (let i = 0; i < buffer.length; i++) {
            const v = buffer[i];
            const normalized = (v - min) / range;
            const y = h - (normalized * h);
            const px = (offset + i) * step;
            if (i === 0) ctx.moveTo(px, y);
            else ctx.lineTo(px, y);
          }
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = lineColor;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.stroke();

          // glow
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = lineWidth * 5;
          ctx.globalAlpha = 0.05;
          ctx.stroke();
          ctx.restore();
        }

        function loop() {
          render();
          raf = window.requestAnimationFrame(loop);
        }

        return {
          show(el) {
            containerEl = document.createElement('div');
            containerEl.className = 'astonishing-sparkline-container';
            // content container
            const header = document.createElement('div');
            header.className = 'astonishing-sparkline-header';
            header.innerText = options.title || 'Astonishing Sparkline';
            containerEl.appendChild(header);

            // canvas
            canvas = document.createElement('canvas');
            canvas.className = 'astonishing-sparkline-canvas';
            containerEl.appendChild(canvas);
            el.appendChild(containerEl);

            ctx = canvas.getContext('2d');

            // handle resize
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            // subscribe to telemetry
            try {
              const sub = openmct.telemetry.subscribe(domainObject, telemetryCallback);
              // API differences: some versions return unsubscribe function, some return subscription object with unsubscribe()
              if (typeof sub === 'function') {
                unsubscribe = sub;
              } else if (sub && typeof sub.unsubscribe === 'function') {
                unsubscribe = () => sub.unsubscribe();
              } else {
                // best-effort: no-op
                unsubscribe = null;
              }
            } catch (err) {
              // Some Open MCT versions require a promise; try both styles gracefully
              try {
                Promise.resolve(openmct.telemetry.subscribe(domainObject, telemetryCallback))
                  .then((sub) => {
                    if (typeof sub === 'function') unsubscribe = sub;
                    else if (sub && typeof sub.unsubscribe === 'function') unsubscribe = () => sub.unsubscribe();
                  })
                  .catch(() => {});
              } catch (e) {}
            }

            // kick off render
            loop();
          },
          destroy() {
            if (raf) {
              window.cancelAnimationFrame(raf);
              raf = null;
            }
            if (unsubscribe) {
              try {
                unsubscribe();
              } catch (e) {
                try { unsubscribe(); } catch (e2) {}
              }
              unsubscribe = null;
            }
            window.removeEventListener('resize', resizeCanvas);
            if (containerEl && containerEl.parentNode) {
              containerEl.parentNode.removeChild(containerEl);
              containerEl = null;
            }
            canvas = null;
            ctx = null;
            buffer = [];
          }
        };
      }
    });
  };
}

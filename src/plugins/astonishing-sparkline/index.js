// Astonishing Sparkline plugin for Open MCT
//
// Provides a lightweight, event-driven canvas sparkline for numeric telemetry.
//
// The view:
//   - Uses the Open MCT Time API to obtain the view's TimeContext.
//   - Uses TelemetryCollection so historical telemetry is fetched on load and
//     realtime telemetry is subscribed to automatically.
//   - Uses telemetry metadata to identify the first range value and its formatter.
//   - Re-renders only when telemetry, the time window, or the canvas size changes.

export default function astonishingSparkline(options = {}) {
  const maxSamples = Math.max(2, Number(options.maxSamples) || 300);
  const bgColor = options.bgColor || '#0b1020';
  const lineColor = options.lineColor || '#00e0a3';
  const lineWidth = options.lineWidth || 2;

  return function install(openmct) {
    openmct.objectViews.addProvider({
      key: 'astonishing.sparkline',
      name: 'Astonishing Sparkline',

      canView(domainObject) {
        return openmct.telemetry.hasNumericTelemetry(domainObject);
      },

      view(domainObject, objectPath) {
        let containerEl = null;
        let canvas = null;
        let ctx = null;

        let timeContext = null;
        let telemetryCollection = null;

        let metadata = null;
        let formatMap = null;
        let rangeMetadata = null;

        let destroyed = false;
        let renderFrame = null;
        let dpr = 1;

        function getRangeFormatter() {
          if (!rangeMetadata || !formatMap) {
            return null;
          }

          return formatMap[rangeMetadata.key];
        }

        function updateMetadata() {
          metadata = openmct.telemetry.getMetadata(domainObject);

          if (!metadata) {
            rangeMetadata = null;
            formatMap = null;
            return;
          }

          // The first range value is the telemetry value intended for
          // plotting on the Y axis.
          rangeMetadata = metadata.valuesForHints(['range'])[0];

          if (!rangeMetadata) {
            formatMap = null;
            return;
          }

          formatMap = openmct.telemetry.getFormatMap(metadata);
        }

        function resizeCanvas() {
          if (!canvas || !containerEl || !ctx) {
            return;
          }

          const rect = containerEl.getBoundingClientRect();

          dpr = window.devicePixelRatio || 1;

          canvas.width = Math.max(2, Math.floor(rect.width * dpr));
          canvas.height = Math.max(2, Math.floor(rect.height * dpr));

          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;

          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          requestRender();
        }

        function getSamples() {
          if (!telemetryCollection || !timeContext) {
            return [];
          }

          const rangeFormatter = getRangeFormatter();

          if (!rangeFormatter) {
            return [];
          }

          const timeSystem = timeContext.getTimeSystem();

          if (!timeSystem) {
            return [];
          }

          /*
           * Telemetry metadata must contain a value whose key matches the
           * active time system. This is how Open MCT maps a telemetry datum
           * onto the global time context.
           */
          const timeMetadata = metadata.value(timeSystem.key);

          if (!timeMetadata) {
            return [];
          }

          const timeFormatter = formatMap[timeMetadata.key];

          if (!timeFormatter) {
            return [];
          }

          const samples = [];

          telemetryCollection.getAll().forEach((datum) => {
            const timestamp = timeFormatter.parse(datum);
            let value = rangeFormatter.parse(datum);

            // A range value can technically be an array. A sparkline
            // represents a single numeric series, so use the first value.
            if (Array.isArray(value)) {
              value = value[0];
            }

            if (
              typeof timestamp === 'number' &&
              Number.isFinite(timestamp) &&
              typeof value === 'number' &&
              Number.isFinite(value)
            ) {
              samples.push({
                timestamp,
                value
              });
            }
          });

          // TelemetryCollection keeps data sorted by time. Limit the amount
          // rendered without changing the collection itself.
          return samples.slice(-maxSamples);
        }

        function render() {
          renderFrame = null;

          if (destroyed || !ctx || !canvas || !timeContext) {
            return;
          }

          const width = canvas.width / dpr;
          const height = canvas.height / dpr;

          ctx.clearRect(0, 0, width, height);

          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, width, height);

          const samples = getSamples();

          if (samples.length < 2) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.fillRect(0, 0, width, height);
            return;
          }

          const values = samples.map((sample) => sample.value);

          let min = Math.min(...values);
          let max = Math.max(...values);

          /*
           * Prefer the actual displayed data range. Metadata min/max describes
           * the telemetry domain, but using the current values keeps the
           * sparkline readable when the telemetry occupies a small portion
           * of that domain.
           */
          if (min === max) {
            min -= 1;
            max += 1;
          }

          const valueRange = max - min;

          const bounds = timeContext.getBounds();
          const timeRange = bounds.end - bounds.start || 1;

          // Subtle background gradient.
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, 'rgba(0, 240, 163, 0.06)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);

          ctx.beginPath();

          samples.forEach((sample, index) => {
            const normalizedX = (sample.timestamp - bounds.start) / timeRange;
            const normalizedY = (sample.value - min) / valueRange;

            const x = Math.max(0, Math.min(width, normalizedX * width));
            const y = height - normalizedY * height;

            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });

          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = lineColor;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.stroke();

          // Small glow effect.
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = lineWidth * 5;
          ctx.globalAlpha = 0.05;
          ctx.stroke();
          ctx.restore();
        }

        /*
         * This is deliberately NOT a render loop.
         *
         * Rendering is scheduled only because something changed:
         *   - telemetry collection emitted an event,
         *   - the time system changed,
         *   - the canvas was resized.
         *
         * requestAnimationFrame is used only to coalesce multiple events
         * arriving during the same browser frame.
         */
        function requestRender() {
          if (destroyed || renderFrame !== null) {
            return;
          }

          renderFrame = window.requestAnimationFrame(render);
        }

        function telemetryChanged() {
          requestRender();
        }

        function timeSystemChanged() {
          // The TelemetryCollection handles the actual historical reload.
          // We only need to refresh the metadata/formatter used for drawing.
          updateMetadata();
          requestRender();
        }

        return {
          show(el) {
            destroyed = false;

            /*
             * Each Open MCT view gets its own TimeContext. This keeps the
             * sparkline synchronized with the global Time Conductor without
             * maintaining an independent time range.
             */
            timeContext = openmct.time.getContextForView(objectPath);

            updateMetadata();

            if (!rangeMetadata) {
              throw new Error(
                `Astonishing Sparkline requires a telemetry value with a "range" hint for ${domainObject.name}.`
              );
            }

            containerEl = document.createElement('div');
            containerEl.className = 'astonishing-sparkline-container';

            const header = document.createElement('div');
            header.className = 'astonishing-sparkline-header';
            header.innerText = options.title || 'Astonishing Sparkline';

            containerEl.appendChild(header);

            canvas = document.createElement('canvas');
            canvas.className = 'astonishing-sparkline-canvas';

            containerEl.appendChild(canvas);
            el.appendChild(containerEl);

            ctx = canvas.getContext('2d');

            resizeCanvas();

            window.addEventListener('resize', resizeCanvas);

            /*
             * TelemetryCollection combines:
             *
             *   1. the historical request for the current time window;
             *   2. the realtime subscription;
             *   3. reaction to TimeContext bounds changes;
             *   4. reaction to TimeContext time-system changes.
             *
             * minmax is appropriate for a plot because it asks telemetry
             * providers for a reduced representation while retaining the
             * extrema needed to represent the signal faithfully.
             */
            telemetryCollection = openmct.telemetry.requestCollection(domainObject, {
              timeContext,
              strategy: 'minmax',
              size: maxSamples
            });

            telemetryCollection.on('add', telemetryChanged);
            telemetryCollection.on('remove', telemetryChanged);
            telemetryCollection.on('clear', telemetryChanged);

            timeContext.on('timeSystemChanged', timeSystemChanged);

            /*
             * load() starts the historical request and realtime subscription.
             * Historical telemetry therefore populates the sparkline on load.
             */
            telemetryCollection.load();

            // Render the empty state immediately. Subsequent renders are
            // triggered by telemetry collection events.
            requestRender();
          },

          destroy() {
            if (destroyed) {
              return;
            }

            destroyed = true;

            if (renderFrame !== null) {
              window.cancelAnimationFrame(renderFrame);
              renderFrame = null;
            }

            window.removeEventListener('resize', resizeCanvas);

            if (timeContext) {
              timeContext.off('timeSystemChanged', timeSystemChanged);
            }

            if (telemetryCollection) {
              telemetryCollection.off('add', telemetryChanged);
              telemetryCollection.off('remove', telemetryChanged);
              telemetryCollection.off('clear', telemetryChanged);
              telemetryCollection.destroy();
              telemetryCollection = null;
            }

            if (containerEl && containerEl.parentNode) {
              containerEl.parentNode.removeChild(containerEl);
            }

            containerEl = null;
            canvas = null;
            ctx = null;
            timeContext = null;
            metadata = null;
            formatMap = null;
            rangeMetadata = null;
          }
        };
      }
    });
  };
}

/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
const PERFORMANCE_OVERLAY_RENDER_INTERVAL = 1000;

export default function PerformanceIndicator() {
  return function install(openmct) {
    let frames = 0;
    let lastCalculated = performance.now();
    openmct.performance = {
      measurements: new Map()
    };

    const indicator = openmct.indicators.simpleIndicator();
    indicator.key = 'performance-indicator';
    indicator.text('~ fps');
    indicator.description('Performance Indicator');
    indicator.statusClass('s-status-info');
    indicator.on('click', showOverlay);

    openmct.indicators.add(indicator);

    let rafHandle = requestAnimationFrame(incrementFrames);

    openmct.on('destroy', () => {
      cancelAnimationFrame(rafHandle);
    });

    function incrementFrames() {
      let now = performance.now();
      if (now - lastCalculated < 1000) {
        frames++;
      } else {
        updateFPS(frames);
        lastCalculated = now;
        frames = 1;
      }

      rafHandle = requestAnimationFrame(incrementFrames);
    }

    function updateFPS(fps) {
      indicator.text(`${fps} fps`);
      if (fps >= 40) {
        indicator.statusClass('s-status-on');
      } else if (fps < 40 && fps >= 20) {
        indicator.statusClass('s-status-warning');
      } else {
        indicator.statusClass('s-status-error');
      }
    }

    function showOverlay() {
      const overlayStylesText = `
          #c-performance-indicator--overlay {
            background-color:rgba(0,0,0,0.5);
            position: absolute;
            width: 300px;
            left: calc(50% - 300px);
          }
      `;
      const overlayMarkup = `
        <div id="c-performance-indicator--overlay" title="Performance Overlay">
          <table id="c-performance-indicator--table">
            <tr class="c-performance-indicator--row"><td class="c-performance-indicator--measurement-name"></td><td class="c-performance-indicator--measurement-value"></td></tr>
          </table>
        </div>
      `;
      const overlayTemplate = document.createElement('div');
      overlayTemplate.innerHTML = overlayMarkup;
      const overlay = overlayTemplate.cloneNode(true);
      overlay.querySelector('.c-performance-indicator--row').remove();
      const overlayStyles = document.createElement('style');
      overlayStyles.appendChild(document.createTextNode(overlayStylesText));

      document.head.appendChild(overlayStyles);
      document.body.appendChild(overlay);

      indicator.off('click', showOverlay);

      const interval = setInterval(() => {
        overlay.querySelector('#c-performance-indicator--table').innerHTML = '';

        for (const [name, value] of openmct.performance.measurements.entries()) {
          const newRow = overlayTemplate
            .querySelector('.c-performance-indicator--row')
            .cloneNode(true);
          newRow.querySelector('.c-performance-indicator--measurement-name').innerText = name;
          newRow.querySelector('.c-performance-indicator--measurement-value').innerText = value;
          overlay.querySelector('#c-performance-indicator--table').appendChild(newRow);
        }
      }, PERFORMANCE_OVERLAY_RENDER_INTERVAL);

      indicator.on(
        'click',
        () => {
          overlayStyles.remove();
          overlay.remove();
          indicator.on('click', showOverlay);
          clearInterval(interval);
        },
        { once: true, capture: true }
      );
    }
  };
}

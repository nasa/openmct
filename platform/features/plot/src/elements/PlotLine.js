/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,Float32Array*/

define(
    ['./PlotSeriesWindow'],
    function (PlotSeriesWindow) {
        "use strict";


        /**
         * Represents a single line or trace of a plot.
         * @param {{PlotLineBuffer}} buffer the plot buffer
         * @constructor
         */
        function PlotLine(buffer) {
            this.buffer = buffer;
        }

        /**
         * Add a point to this plot line.
         * @param {number} domainValue the domain value
         * @param {number} rangeValue the range value
         */
        PlotLine.prototype.addPoint = function (domainValue, rangeValue) {
            var buffer = this.buffer,
                index;

            // Make sure we got real/useful values here...
            if (domainValue !== undefined && rangeValue !== undefined) {
                index = buffer.findInsertionIndex(domainValue);

                // Already in the buffer? Skip insertion
                if (index < 0) {
                    return;
                }

                // Insert the point
                if (!buffer.insertPoint(domainValue, rangeValue, index)) {
                    // If insertion failed, trim from the beginning...
                    buffer.trim(1);
                    // ...and try again.
                    buffer.insertPoint(domainValue, rangeValue, index);
                }
            }
        };

        /**
         * Add a series of telemetry data to this plot line.
         * @param {TelemetrySeries} series the data series
         * @param {string} [domain] the key indicating which domain
         *        to use when looking up data from this series
         * @param {string} [range] the key indicating which range
         *        to use when looking up data from this series
         */
        PlotLine.prototype.addSeries = function (series, domain, range) {
            var buffer = this.buffer;

            // Insert a time-windowed data series into the buffer
            function insertSeriesWindow(seriesWindow) {
                var count = seriesWindow.getPointCount();

                function doInsert() {
                    var firstTimestamp = seriesWindow.getDomainValue(0),
                        lastTimestamp = seriesWindow.getDomainValue(count - 1),
                        startIndex = buffer.findInsertionIndex(firstTimestamp),
                        endIndex = buffer.findInsertionIndex(lastTimestamp);

                    // Does the whole series fit in between two adjacent indexes?
                    if ((startIndex === endIndex) && startIndex > -1) {
                        // Insert it in between
                        buffer.insert(seriesWindow, startIndex);
                    } else {
                        // Split it up, and add the two halves
                        seriesWindow.split().forEach(insertSeriesWindow);
                    }
                }

                // Only insert if there are points to insert
                if (count > 0) {
                    doInsert();
                }
            }

            // Should try to add via insertion if a
            // clear insertion point is available;
            // if not, should split and add each half.
            // Insertion operation also needs to factor out
            // redundant timestamps, for overlapping data
            insertSeriesWindow(new PlotSeriesWindow(
                series,
                domain,
                range,
                0,
                series.getPointCount()
            ));
        };

        return PlotLine;
    }
);

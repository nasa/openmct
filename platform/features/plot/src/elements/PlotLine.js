/*global define,Float32Array*/

define(
    ['./PlotSeriesWindow'],
    function (PlotSeriesWindow) {
        "use strict";


        function PlotLine(buffer) {

            // Insert a time-windowed data series into the buffer
            function insertSeriesWindow(seriesWindow) {
                var count = seriesWindow.getPointCount();

                function doInsert() {
                    var firstTimestamp = buffer.getDomainValue(0),
                        lastTimestamp = buffer.getDomainValue(count - 1),
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

            function createWindow(series, domain, range) {
                return new PlotSeriesWindow(
                    series,
                    domain,
                    range,
                    0,
                    series.getPointCount()
                );
            }

            return {
                /**
                 * Add a point to this plot line.
                 * @param {number} domainValue the domain value
                 * @param {number} rangeValue the range value
                 */
                addPoint: function (domainValue, rangeValue) {
                    var index = buffer.findInsertionIndex(domainValue);
                    if (index > -1) {
                        // Insert the point
                        if (!buffer.insertPoint(domainValue, rangeValue, index)) {
                            // If insertion failed, trim from the beginning...
                            buffer.trim(1);
                            // ...and try again.
                            buffer.insertPoint(domainValue, rangeValue, index);
                        }
                    }
                },
                /**
                 * Add a series of telemetry data to this plot line.
                 * @param {TelemetrySeries} series the data series
                 * @param {string} [domain] the key indicating which domain
                 *        to use when looking up data from this series
                 * @param {string} [range] the key indicating which range
                 *        to use when looking up data from this series
                 */
                addSeries: function (series, domain, range) {
                    // Should try to add via insertion if a
                    // clear insertion point is available;
                    // if not, should split and add each half.
                    // Insertion operation also needs to factor out
                    // redundant timestamps, for overlapping data
                    insertSeriesWindow(createWindow(series, domain, range));
                }
            };
        }

        return PlotLine;
    }
);
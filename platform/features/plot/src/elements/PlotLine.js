/*global define,Float32Array*/

define(
    ['./PlotSeriesWindow'],
    function (PlotSeriesWindow) {
        "use strict";


        function PlotLine(initialSize, maxPoints) {
            var buffer,
                length = 0,
                timeWindow;

            // Binary search the buffer to find the index where
            // a point with this timestamp should be inserted.
            // After is a flag indicating whether it is preferred
            // to insert after or before its nearest timestamp
            function searchBuffer(timestamp, after) {
                // Binary search for an appropriate insertion index.
                function binSearch(min, max) {
                    var mid = Math.floor((min + max) / 2),
                        ts;

                    if (max < min) {
                        return -1;
                    }

                    ts = buffer[mid * 2];

                    // Check for an exact match...
                    if (ts === timestamp) {
                        // This is a case where we'll need to
                        // split up what we want to insert.
                        return mid + after ? -1 : 1;
                    } else {
                        // Found our index?
                        if (max === min) {
                            return max;
                        }
                        // Otherwise, search recursively
                        if (ts < timestamp) {

                        } else {

                        }
                    }

                }

                // Booleanize
                after = !!after;

                return binSearch(0, length - 1);
            }

            function insertSeriesWindow(seriesWindow) {
                var startIndex = findStartIndex(),
                    endIndex = findEndIndex();

                if (startIndex === endIndex) {

                } else {
                    // Split it up, and add the two halves
                    seriesWindow.split().forEach(insertSeriesWindow);
                }
            }

            function createWindow(series, domain, range) {
                // TODO: Enforce time window, too!
                return new PlotSeriesWindow(
                    series,
                    domain,
                    range,
                    0,
                    series.getPointCount()
                );
            }

            return {
                addData: function (domainValue, rangeValue) {
                    // Should append to buffer
                },
                addSeries: function (series, domain, range) {
                    // Should try to add via insertion if a
                    // clear insertion point is available;
                    // if not, should split and add each half.
                    // Insertion operation also needs to factor out
                    // redundant timestamps, for overlapping data
                    insertSeriesWindow(createWindow(series, domain, range));
                },
                setTimeWindow: function (start, end) {
                    timeWindow = [ start, end ];
                },
                clearTimeWindow: function () {
                    timeWindow = undefined;
                }
            };
        }

        return PlotLine;
    }
);
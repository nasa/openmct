/*global define*/
define(
    [],
    function () {
        "use strict";

        /**
         * Provides a window on a telemetry data series, to support
         * insertion into a plot line.
         */
        function PlotSeriesWindow(series, domain, range, start, end) {
            return {
                getPointCount: function () {
                    return end - start;
                },
                getDomainValue: function (index) {
                    return series.getDomainValue(index + start, domain);
                },
                getRangeValue: function (index) {
                    return series.getRangeValue(index + start, range);
                },
                split: function () {
                    var mid = Math.floor((end + start) / 2);
                    return ((end - start) > 1) ?
                            [
                                new PlotSeriesWindow(
                                    series,
                                    domain,
                                    range,
                                    start,
                                    mid
                                ),
                                new PlotSeriesWindow(
                                    series,
                                    domain,
                                    range,
                                    mid,
                                    end
                                )
                            ] : [];
                }
            };
        }

        return PlotSeriesWindow;
    }
);
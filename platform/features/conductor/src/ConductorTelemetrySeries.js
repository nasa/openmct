/*global define*/

define(
    function () {
        'use strict';

        function ConductorTelemetrySeries(series, conductor) {
            var max = series.getPointCount() - 1;

            function binSearch(min, max, value) {
                var mid = Math.floor((min + max) / 2);

                return min >= max ? min :
                        series.getDomainValue(mid) < value ?
                                binSearch(mid + 1, max, value) :
                                        binSearch(min, mid - 1, value);
            }

            this.startIndex = binSearch(0, max, conductor.displayStart());
            this.endIndex = binSearch(0, max, conductor.displayEnd());
            this.series = series;
        }

        ConductorTelemetrySeries.prototype.getPointCount = function () {
            return Math.max(0, this.endIndex - this.startIndex);
        };

        ConductorTelemetrySeries.prototype.getDomainValue = function (i, d) {
            return this.series.getDomainValue(i + this.startIndex, d);
        };

        ConductorTelemetrySeries.prototype.getRangeValue = function (i, r) {
            return this.series.getRangeValue(i + this.startIndex, r);
        };

        return ConductorTelemetrySeries;
    }
);

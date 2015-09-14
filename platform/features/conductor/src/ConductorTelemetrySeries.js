/*global define*/

define(
    function () {
        'use strict';

        function ConductorTelemetrySeries(series, conductor) {
            var max = series.getPointCount() - 1;

            function binSearch(min, max, value) {
                var mid = Math.floor((min + max) / 2),
                    domainValue = series.getDomainValue(mid);

                if (min >= max) {
                    return min;
                }

                if (domainValue < value) {
                    return binSearch(mid + 1, max);
                } else {
                    return binSearch(min, mid - 1);
                }
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
            return this.series.getDomainValue(i + this.startIndex, r);
        };

        return ConductorTelemetrySeries;
    }
);

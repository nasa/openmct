/*global define, setTimeout*/

define([
    'lodash'
], function (
    _
) {
    'use strict';

    var e10 = Math.sqrt(50),
        e5 = Math.sqrt(10),
        e2 = Math.sqrt(2);

    /**
     * Nicely formatted tick steps from d3-array.
     */
    function tickStep(start, stop, count) {
        var step0 = Math.abs(stop - start) / Math.max(0, count),
            step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
            error = step0 / step1;
        if (error >= e10) {
            step1 *= 10;
        } else if (error >= e5) {
            step1 *= 5;
        } else if (error >= e2) {
            step1 *= 2;
        }
        return stop < start ? -step1 : step1;
    }

    /**
     * Find the precision (number of decimals) of a step.  Used to round
     * ticks to precise values.
     */
    function getPrecision(step) {
        var exponential = step.toExponential(),
            i = exponential.indexOf('e');
        if (i === -1) {
            return 0;
        }

        var precision = Math.max(0, -(+exponential.slice(i + 1)));

        if (precision > 20) precision = 20;

        return precision;
    }


    /**
     * Linear tick generation from d3-array.
     */
    function ticks(start, stop, count) {
        var step = tickStep(start, stop, count),
            precision = getPrecision(step);
        return _.range(
            Math.ceil(start / step) * step,
            Math.floor(stop / step) * step + step / 2, // inclusive
            step
        ).map(function round(tick) {
            return +tick.toFixed(precision);
        });
    }

    function commonPrefix(a, b) {
        var maxLen = Math.min(a.length, b.length);
        var breakpoint = 0;
        for (var i = 0; i < maxLen; i++) {
            if (a[i] !== b[i]) {
                break;
            }
            if (a[i] === ' ') {
                breakpoint = i + 1;
            }
        }
        return a.slice(0, breakpoint);
    }

    function commonSuffix(a, b) {
        var maxLen = Math.min(a.length, b.length);
        var breakpoint = 0;
        for (var i = 0; i <= maxLen; i++) {
            if (a[a.length - i] !== b[b.length - i]) {
                break;
            }
            if ('. '.indexOf(a[a.length - i]) !== -1) {
                breakpoint = i;
            }
        }
        return a.slice(a.length - breakpoint);
    }

    function MCTTicksController($scope, $element) {
        this.$scope = $scope;
        this.$element = $element;

        if (!window.ticks) {
            window.ticks = [];
        }

        window.ticks.push(this);

        this.tickCount = 4;
        this.tickUpdate = false;
        this.updateTicks = this.updateTicks.bind(this);
        this.axis.on('change:displayRange', this.updateTicks);
        if (this.axis.get('key')) {
            this.updateTicks(this.axis.get('displayRange'));
        }
        this.$scope.$on('$destroy', function () {
            this.axis.off('change:displayRange', this.updateTicks);
        }.bind(this));
    }

    MCTTicksController.$inject = ['$scope', '$element'];

    /**
     * Determine whether ticks should be regenerated for a given range.
     * Ticks are updated a) if they don't exist, b) if the existing ticks are
     * outside of given range, or c) if the range exceeds the size of the tick
     * range by more than one tick step.
     * @private
     */
    MCTTicksController.prototype.shouldRegenerateTicks = function (range) {
        if (!this.tickRange || !this.$scope.ticks || !this.$scope.ticks.length) {
            return true;
        }
        if (this.tickRange.max > range.max || this.tickRange.min < range.min) {
            return true;
        }
        if (Math.abs(range.max - this.tickRange.max) > this.tickRange.step) {
            return true;
        }
        if (Math.abs(this.tickRange.min - range.min) > this.tickRange.step) {
            return true;
        }
        return false;
    };

    MCTTicksController.prototype.getTicks = function () {
        var number = this.tickCount;
        var clampRange = this.axis.get('values');
        var range = this.axis.get('displayRange');
        if (clampRange) {
            return clampRange.filter(function (value) {
                return value <= range.max && value >= range.min;
            }, this);
        }
        return ticks(range.min, range.max, number);
    };

    MCTTicksController.prototype.updateTicks = function (range) {
        if (!range) {
            delete this.$scope.min;
            delete this.$scope.max;
            delete this.$scope.interval;
            delete this.tickRange;
            delete this.$scope.ticks;
            delete this.shouldCheckWidth;
            return;
        }
        var format = this.axis.get('format');
        if (!format) {
            return;
        }
        this.$scope.min = range.min;
        this.$scope.max = range.max;
        this.$scope.interval = Math.abs(range.min - range.max);
        if (this.shouldRegenerateTicks(range)) {
            var newTicks = this.getTicks();
            this.tickRange = {
                min: Math.min.apply(Math, newTicks),
                max: Math.max.apply(Math, newTicks),
                step: newTicks[1] - newTicks[0]
            };

            newTicks = newTicks
                .map(function (tickValue) {
                    return {
                        value: tickValue,
                        text: format(tickValue)
                    };
                }, this);

            if (newTicks.length && typeof newTicks[0].text === 'string' ) {
                var tickText = newTicks.map(function (t) {
                    return t.text;
                });
                var prefix = tickText.reduce(commonPrefix);
                var suffix = tickText.reduce(commonSuffix);
                newTicks.forEach(function (t, i) {
                    t.fullText = t.text;
                    if (suffix.length) {
                        t.text = t.text.slice(prefix.length, -suffix.length);
                    } else {
                        t.text = t.text.slice(prefix.length);
                    }
                });
            }
            this.$scope.ticks = newTicks
            this.shouldCheckWidth = true;
        }
        // todo: break out tick updating.
        this.scheduleTickUpdate();
    };

    MCTTicksController.prototype.scheduleTickUpdate = function () {
        if (this.tickUpdate) {
            return;
        }
        this.tickUpdate = true;
        setTimeout(this.doTickUpdate.bind(this), 0);
    };

    MCTTicksController.prototype.doTickUpdate = function () {
        if (this.shouldCheckWidth) {
            this.$scope.$digest();
            var element = this.$element[0],
                ticks = element.querySelectorAll('.gl-plot-tick > span'),
                tickWidth = Number([].reduce.call(ticks, function (memo, first) {
                    return Math.max(memo, first.offsetWidth);
                }, 0));

            this.$scope.tickWidth = tickWidth;
            this.$scope.$emit('plot:tickWidth', tickWidth);
            this.shouldCheckWidth = false;
        }
        this.$scope.$digest();
        this.tickUpdate = false;
    };

    return MCTTicksController;
});

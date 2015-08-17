/*global define*/

define(function() {
    "use strict";

    var utils = {};

    utils.boxPointsFromOppositeCorners = function(start, end) {
        // Given two points defining opposite corners of a square,
        // return an array of points containing all of the boxes' rectangles.
        return [
            start,
            {domain: start.domain, range: end.range},
            end,
            {domain: end.domain, range: start.range}
        ];
    };

    utils.oppositeCornersFromBoxPoints = function(boxPoints) {
        // Given an array of box points, return the topLeft and bottomRight points of the box.
        var topLeft = boxPoints.reduce(function(topLeft, currentPoint) {
            if (!topLeft) {
                return currentPoint;
            }
            if (currentPoint.domain <= topLeft.domain &&
                    currentPoint.range >= topLeft.range) {
                return currentPoint;
            }
            return topLeft;
        });

        var bottomRight = boxPoints.reduce(function(bottomRight, currentPoint) {
            if (!bottomRight) {
                return currentPoint;
            }
            if (currentPoint.domain >= bottomRight.domain &&
                    currentPoint.range <= bottomRight.range) {
                return currentPoint;
            }
            return bottomRight;
        });

        return {
            topLeft: topLeft,
            bottomRight: bottomRight
        };
    };

    utils.elementPositionAsPlotPosition = function(elementPosition, elementBounds, viewport) {
        // Convert an (x, y) pair in element space to a
        // (domain, range) pair viewport.

        // Element space has (0,0) as the topLeft corner, With x
        // increasing to the right and y increasing to the bottom.

        var maxDomain = viewport.bottomRight.domain;
        var minDomain = viewport.topLeft.domain;
        var domainDenominator = maxDomain - minDomain;

        var maxRange = viewport.topLeft.range;
        var minRange = viewport.bottomRight.range;
        var rangeDenominator = maxRange - minRange;

        var xFraction = elementPosition.x / elementBounds.width;
        var yFraction = elementPosition.y / elementBounds.height;

        return {
            domain: minDomain + domainDenominator * xFraction,
            range: maxRange - rangeDenominator * yFraction
        };
    };


    return utils;
});

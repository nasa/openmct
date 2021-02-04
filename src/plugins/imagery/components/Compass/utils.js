export function normalizeDegrees(degrees) {
    const base = degrees % 360;

    return base >= 0 ? base : 360 + base;
}

export function inRange(degrees, [min, max]) {
    return min > max
        ? (degrees >= min && degrees < 360) || (degrees <= max && degrees >= 0)
        : degrees >= min && degrees <= max;
}

export function percentOfRange(degrees, [min, max]) {
    let distance = degrees;
    let minRange = min;
    let maxRange = max;

    if (min > max) {
        if (distance < max) {
            distance += 360;
        }

        maxRange += 360;
    }

    return (distance - minRange) / (maxRange - minRange);
}

export function normalizeSemiCircleDegrees(rawDegrees) {
    // in case tony hawk is providing us degrees
    let degrees = rawDegrees % 360;

    // westward degrees are between 0 and -180 exclusively
    if (degrees > 180) {
        degrees = degrees - 360;
    }

    // eastward degrees are between 0 and 180 inclusively
    if (degrees <= -180) {
        degrees = 360 - degrees;
    }

    return degrees;
}

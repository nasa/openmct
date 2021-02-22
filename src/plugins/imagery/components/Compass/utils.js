export function rotate(direction, ...rotations) {
    const rotation = rotations.reduce((a, b) => a + b, 0);

    return normalizeCompassDirection(direction + rotation);
}

export function normalizeCompassDirection(degrees) {
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

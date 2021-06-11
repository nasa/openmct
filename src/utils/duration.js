const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

function normalizeAge(num) {
    const hundredtized = num * 100;
    const isWhole = hundredtized % 100 === 0;

    return isWhole ? hundredtized / 100 : num;
}

function toDoubleDigits(num) {
    if (num >= 10) {
        return num;
    } else {
        return `0${num}`;
    }
}

export function getDuration(numericDuration) {
    let result;
    let age;

    if (numericDuration > ONE_DAY - 1) {
        age = normalizeAge((numericDuration / ONE_DAY)).toFixed(2);
        result = `+ ${age} day`;

        if (age !== 1) {
            result += 's';
        }
    } else if (numericDuration > ONE_HOUR - 1) {
        age = normalizeAge((numericDuration / ONE_HOUR).toFixed(2));
        result = `+ ${age} hour`;

        if (age !== 1) {
            result += 's';
        }
    } else {
        age = normalizeAge((numericDuration / ONE_MINUTE).toFixed(2));
        result = `+ ${age} min`;

        if (age !== 1) {
            result += 's';
        }
    }

    return result;
}

export function getPreciseDuration(numericDuration) {
    let result;

    const days = toDoubleDigits(Math.floor((numericDuration) / (24 * 60 * 60 * 1000)));
    let remaining = (numericDuration) % (24 * 60 * 60 * 1000);
    const hours = toDoubleDigits(Math.floor((remaining) / (60 * 60 * 1000)));
    remaining = (remaining) % (60 * 60 * 1000);
    const minutes = toDoubleDigits(Math.floor((remaining) / (60 * 1000)));
    remaining = (remaining) % (60 * 1000);
    const seconds = toDoubleDigits(Math.floor((remaining) / (1000)));
    result = `${days}:${hours}:${minutes}:${seconds}`;

    return result;
}

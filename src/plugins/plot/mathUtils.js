export const e = Math.exp(1);

export function log(n, base = e) {
    if (base === Math.exp(1)) {
        return Math.log(n);
    }

    return Math.log(n) / Math.log(base);
}

export function antilog(n, base = e) {
    return Math.pow(base, n);
}

export function getLimitClass(limit, prefix) {
    let cssClass = '';
    if (limit.color) {
        cssClass = `${cssClass} ${prefix}${limit.color}`;
    }

    if (limit.isUpper) {
        cssClass = `${cssClass} ${prefix}upr`;
    } else {
        cssClass = `${cssClass} ${prefix}lwr`;
    }

    if (limit.level) {
        cssClass = `${cssClass} ${prefix}${limit.level}`;
    }

    return cssClass;
}

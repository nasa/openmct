export function getLimitClass(limit, prefix) {
  let cssClass = '';
  //If color exists then use it, fall back to the cssClass
  if (limit.color) {
    cssClass = `${cssClass} ${prefix}${limit.color}`;
  } else if (limit.cssClass) {
    cssClass = `${cssClass}${limit.cssClass}`;
  }

  // If we applied the cssClass then skip these classes
  if (limit.cssClass === undefined) {
    if (limit.isUpper) {
      cssClass = `${cssClass} ${prefix}upr`;
    } else {
      cssClass = `${cssClass} ${prefix}lwr`;
    }

    if (limit.level) {
      cssClass = `${cssClass} ${prefix}${limit.level}`;
    }

    if (limit.needsHorizontalAdjustment) {
      cssClass = `${cssClass} --align-label-right`;
    }

    if (limit.needsVerticalAdjustment) {
      cssClass = `${cssClass} --align-label-below`;
    }
  }

  return cssClass;
}

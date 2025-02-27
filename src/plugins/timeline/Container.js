class Container {
  constructor(domainObject, size) {
    this.domainObjectIdentifier = domainObject.identifier;
    this.size = size;
    this.scale = getContainerScale(domainObject);
  }
}

function getContainerScale(domainObject) {
  if (domainObject.type === 'telemetry.plot.stacked') {
    return domainObject?.composition?.length;
  }

  return 1;
}

export default Container;

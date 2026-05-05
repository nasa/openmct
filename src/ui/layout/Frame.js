import { v4 as uuid } from 'uuid';

class Frame {
  constructor(domainObjectIdentifier, size) {
    this.id = uuid();
    this.domainObjectIdentifier = domainObjectIdentifier;
    this.size = size;

    this.noFrame = false;
  }
}

export default Frame;

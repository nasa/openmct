import uuid from 'uuid';

class Frame {
    constructor(domainObjectIdentifier, height) {
        this.id = uuid();
        this.domainObjectIdentifier = domainObjectIdentifier;
        this.height = height;

        this.noFrame = false;
    }
}

export default Frame;

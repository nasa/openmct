var id = 0;

class Frame {
    constructor(domainObjectIdentifier, height, cssClass) {
        this.id = id;
        this.domainObjectIdentifier = domainObjectIdentifier;
        this.height = height;
        this.cssClass = cssClass ? cssClass : '';
        this.noFrame = false;

        id++;
    }
}

export default Frame;

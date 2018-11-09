class Frame {
    constructor(domainObjectIdentifier, height, cssClass) {
        this.domainObjectIdentifier = domainObjectIdentifier;
        this.height = height;
        this.cssClass = cssClass ? cssClass : '';
        this.noFrame = false;
    }
}

export default Frame;

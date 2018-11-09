class Frame {
    constructor(domainObject, height, cssClass) {
        this.domainObject = domainObject;
        this.height = height;
        this.cssClass = cssClass ? cssClass : '';
        this.noFrame = false;
    }
}

export default Frame;

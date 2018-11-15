import uuid from 'uuid';

class Container {
    constructor (width) {
        this.id = uuid();
        this.frames = [];
        this.width = width;
    }

    addFrame(frameObject) {
        this.frames.push(frameObject);
    }
}

export default Container;

import uuid from 'uuid';

class Container {
    constructor (size) {
        this.id = uuid();
        this.frames = [];
        this.size = size;
    }

    addFrame(frameObject) {
        this.frames.push(frameObject);
    }
}

export default Container;

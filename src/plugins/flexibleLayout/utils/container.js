import Frame from './frame';

class Container {
    constructor (width) {
        this.frames = [new Frame({}, 0, 'c-fl-frame--first-in-container')];
        this.width = width;
    }

    addFrame(frameObject) {
        this.frames.push(frameObject);
    }
}

export default Container;

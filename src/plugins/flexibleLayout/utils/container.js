import Frame from './frame';

class Container {
    constructor (width) {
        this.frames = [new Frame({}, '15px', 'c-fl-frame--empty-container')];
        this.width = width;
    }

    addFrame(frameObject) {
        this.frames.push(frameObject);
    }
}

export default Container;

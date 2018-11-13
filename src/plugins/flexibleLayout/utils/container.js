import Frame from './frame';

var id = 0;

class Container {
    constructor (width) {
        this.index = id;
        this.frames = [];
        this.width = width;
        id++;
    }

    addFrame(frameObject) {
        this.frames.push(frameObject);
    }
}

export default Container;

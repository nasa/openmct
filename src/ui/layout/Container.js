import { v4 as uuid } from 'uuid';

class Container {
  constructor(size) {
    this.id = uuid();
    this.frames = [];
    this.size = size;
  }
}

export default Container;

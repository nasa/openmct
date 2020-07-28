//TODO: should we limit the queue size?
//const MAX_QUEUE_SIZE = 10;

export default class CouchObjectQueue {
    constructor(model, rev) {
        this.rev = rev;
        this.models = model ? [model] : [];
    }

    updateRevision(rev) {
        this.rev = rev;
    }

    hasNext() {
        return this.models.length;
    }

    enqueue(item) {
        this.models.push(item);
    }

    dequeue() {
        return this.models.shift();
    }

    clear() {
        this.rev = undefined;
        this.models = [];
    }

}

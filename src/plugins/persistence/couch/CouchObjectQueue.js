//TODO: should we limit the queue size?
//const MAX_QUEUE_SIZE = 10;

export default class CouchObjectQueue {
    constructor(object, rev) {
        this.rev = rev;
        this.objects = object ? [object] : [];
        this.pending = false;
    }

    updateRevision(rev) {
        this.rev = rev;
    }

    hasNext() {
        return this.objects.length;
    }

    enqueue(item) {
        this.objects.push(item);
    }

    dequeue() {
        return this.objects.shift();
    }

    clear() {
        this.rev = undefined;
        this.objects = [];
    }

}

import CouchDocument from "./CouchDocument";
import CouchObjectQueue from "./CouchObjectQueue";

const REV = "_rev";
const ID = "_id";

export default class CouchObjectProvider {
    constructor(openmct, url, namespace) {
        this.openmct = openmct;
        this.url = url;
        this.namespace = namespace;
        this.objectQueue = {};
    }

    request(subPath, method, value) {
        return fetch(this.url + '/' + subPath, {
            method: method,
            body: JSON.stringify(value)
        }).then(response => response.json())
            .then(function (response) {
                return response;
            }, function () {
                return undefined;
            });
    }

    // Check the response to a create/update/delete request;
    // track the rev if it's valid, otherwise return false to
    // indicate that the request failed.
    // persist any queued objects
    checkResponse(response, intermediateResponse) {
        let requestSuccess = false;
        const id = response.id;
        let rev;
        if (response && response.ok) {
            rev = response.rev;
            requestSuccess = true;
        }

        intermediateResponse.resolve(requestSuccess);

        if (id) {
            if (!this.objectQueue[id]) {
                this.objectQueue[id] = new CouchObjectQueue(undefined, rev);
            }

            this.objectQueue[id].updateRevision(rev);
            this.objectQueue[id].pending = false;
            if (this.objectQueue[id].hasNext()) {
                this.updateQueued(id);
            }
        }
    }

    getModel(response) {
        if (response && response.model) {
            let key = response[ID];
            let object = response.model;
            object.identifier = {
                namespace: this.namespace,
                key: key
            };
            if (!this.objectQueue[key]) {
                this.objectQueue[key] = new CouchObjectQueue(undefined, response[REV]);
            }

            this.objectQueue[key].updateRevision(response[REV]);

            return object;
        } else {
            return undefined;
        }
    }

    get(identifier) {
        return this.request(identifier.key, "GET").then(this.getModel.bind(this));
    }

    getIntermediateResponse() {
        let intermediateResponse = {};
        intermediateResponse.promise = new Promise(function (resolve, reject) {
            intermediateResponse.resolve = resolve;
            intermediateResponse.reject = reject;
        });

        return intermediateResponse;
    }

    enqueueObject(key, model, intermediateResponse) {
        if (this.objectQueue[key]) {
            this.objectQueue[key].enqueue({
                model,
                intermediateResponse
            });
        } else {
            this.objectQueue[key] = new CouchObjectQueue({
                model,
                intermediateResponse
            });
        }
    }

    create(model) {
        let intermediateResponse = this.getIntermediateResponse();
        const key = model.identifier.key;
        this.enqueueObject(key, model, intermediateResponse);
        this.objectQueue[key].pending = true;
        const queued = this.objectQueue[key].dequeue();
        this.request(key, "PUT", new CouchDocument(key, queued.model)).then((response) => {
            this.checkResponse(response, queued.intermediateResponse);
        });

        return intermediateResponse.promise;
    }

    updateQueued(key) {
        if (!this.objectQueue[key].pending) {
            this.objectQueue[key].pending = true;
            const queued = this.objectQueue[key].dequeue();
            this.request(key, "PUT", new CouchDocument(key, queued.model, this.objectQueue[key].rev)).then((response) => {
                this.checkResponse(response, queued.intermediateResponse);
            });
        }
    }

    update(model) {
        let intermediateResponse = this.getIntermediateResponse();
        const key = model.identifier.key;
        this.enqueueObject(key, model, intermediateResponse);
        this.updateQueued(key);

        return intermediateResponse.promise;
    }
}

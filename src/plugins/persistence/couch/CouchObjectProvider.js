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
    checkResponse(response) {
        let requestSuccess = false;
        if (response && response.ok) {
            const id = response.id;
            const rev = response.rev;
            if (!this.objectQueue[id]) {
                this.objectQueue[id] = new CouchObjectQueue(undefined, rev);
            }
            this.objectQueue[id].updateRevision(rev);
            requestSuccess = true;
        }
        if (response && response.id) {
            if (this.objectQueue[response.id] && this.objectQueue[response.id].hasNext()) {
                this.updateQueued();
            }
        }
        return requestSuccess;
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
            //This causes issues with the objectMigration plugin's needsMigration method.
            return undefined;
        }
    }

    get(identifier) {
        return this.request(identifier.key, "GET").then(this.getModel.bind(this));
    }

    create(model) {
        const key = model.identifier.key;
        if (this.objectQueue[key]) {
            //there's already a create in progress, let's queue this version
            this.objectQueue[key].enqueue(model);
        } else {
            this.objectQueue[key] = new CouchObjectQueue([model]);
        }
        const queuedModel = this.objectQueue[key].dequeue();
        return this.request(key, "PUT", new CouchDocument(key, queuedModel)).then(this.checkResponse.bind(this));
    }

    updateQueued(key) {
        const queuedModel = this.objectQueue[key].dequeue();
        return this.request(key, "PUT", new CouchDocument(key, queuedModel, this.objectQueue[key].rev)).then(this.checkResponse.bind(this));
    }

    update(model) {
        const key = model.identifier.key;
        if (this.objectQueue[key]) {
            this.objectQueue[key].enqueue(model);
        } else {
            this.objectQueue[key] = new CouchObjectQueue([model]);
        }
        return this.updateQueued(key);
    }
}

import CouchDocument from "./CouchDocument";

const REV = "_rev";
const ID = "_id";

export default class CouchObjectProvider {
    constructor(openmct, url, namespace) {
        this.openmct = openmct;
        this.url = url;
        this.namespace = namespace;        this.namespace = namespace;        this.namespace = namespace;
        this.revs = {};
    }

    request(subPath, method, value) {
        console.log(subPath, method, value);
        return fetch(this.url + '/' + subPath, {
            method: method,
            body: value
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
        if (response && response.ok) {
            this.revs[response.id] = response.rev;
            return response.ok;
        } else {
            return false;
        }
    }

    getModel(response) {
        if (response && response.model) {
            let key = response[ID];
            this.revs[key] = response[REV];
            let object = response.model;
            object.identifier = {
                namespace: this.namespace,
                key: key
            };
            return object;
        } else {
            return undefined;
        }
    }

    get(identifier) {
        return this.request(identifier.key, "GET").then(this.getModel.bind(this));
    }

    create(model) {
        return this.request(model.identifier, "PUT", new CouchDocument(model.identifier.key, model)).then(this.checkResponse.bind(this));
    }

    update(model) {
        return this.request(model.identifier, "PUT", model).then(this.checkResponse.bind(this));
    }
}

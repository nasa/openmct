import CouchDocument from "./CouchDocument";
import * as objectUtils from "@/api/objects/object-utils";
const REV = "_rev";
const ID = "_id";

export default class CouchObjectProvider {
    constructor(openmct, config) {
        this.openmct = openmct;
        this.url = config.couch_db_location;
        this.path = config.path;
        this.revs = {};
    }

    request(subPath, method, value) {
        console.log(subPath, method, value);
        return fetch({
            method: method,
            url: this.path + '/' + subPath,
            body: value
        }).then(function (response) {
            return response.data;
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
    };

    getModel(response) {
        if (response && response.model) {
            this.revs[response[ID]] = response[REV];
            return response.model;
        } else {
            return undefined;
        }
    }

    get(identifier) {
        return this.request(identifier, "GET").then(this.getModel.bind(this));
    }

    create(model) {
        return this.request(model.identifier, "PUT", new CouchDocument(objectUtils.parseKeyString(model.identifier), model)).then(this.checkResponse.bind(this));
    }

    update(model) {
        return this.request(model.identifier, "PUT", model).then(this.checkResponse.bind(this));
    }
}

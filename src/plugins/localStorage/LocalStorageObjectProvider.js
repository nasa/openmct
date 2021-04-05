export default class LocalStorageObjectProvider {
    constructor({spaceKey = 'mct'}) {
        this.localStorage = window.localStorage;
        this.space = this.initializeSpace(spaceKey);
    }
    get(identifier) {
        if (this.getSpaceAsObject()[identifier.key] !== undefined) {
            const persistedModel = this.getSpaceAsObject()[identifier.key];
            const domainObject = {
                identifier,
                ...persistedModel
            };

            return Promise.resolve(domainObject);
        } else {
            return Promise.resolve(undefined);
        }
    }
    getSpaceAsObject() {
        return JSON.parse(this.space);
    }
    create(model) {
        return this.setModel(model);
    }
    update(model) {
        return this.setModel(model);
    }
    setModel(model) {
        this.space[model.identifier.key] = JSON.stringify(model);
        this.persist();

        return Promise.resolve(true);
    }
    initializeSpace(spaceKey) {
        if (this.localStorage[spaceKey] === undefined) {
            this.localStorage[spaceKey] = JSON.stringify({});
        }

        return this.localStorage[spaceKey];
    }
}

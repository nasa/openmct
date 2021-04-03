export default class LocalStorageObjectProvider {
    constructor({spaceKey = 'mct'}) {
        this.localStorage = window.localStorage;
        this.space = this.initializeSpace(spaceKey);
    }
    get(identifier) {
        if (this.space[identifier.key] !== undefined) {
            return Promise.resolve(JSON.parse(this.space[identifier.key]));
        } else {
            return Promise.resolve(undefined);
        }
    }
    create(model) {
        return this.setModel(model);
    }
    update(model) {
        return this.setModel(model);
    }
    setModel(model) {
        this.space[model.identifier.key] = JSON.stringify(model);

        return Promise.resolve(true);
    }
    initializeSpace(spaceKey) {
        if (this.localStorage[spaceKey] === undefined) {
            this.localStorage[spaceKey] = {};
        }

        return this.localStorage[spaceKey];
    }
}

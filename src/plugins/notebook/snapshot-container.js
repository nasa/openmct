const NOTEBOOK_SNAPSHOT_STORAGE = 'notebook-snapshot-storage';
const NOTEBOOK_SANAPSHOT_MAX_COUNT = 10;

class SnapshotContainer {
    constructor() {
        if (! SnapshotContainer.instance) {
            SnapshotContainer.instance = this;
        }

        return SnapshotContainer.instance;
    }

    saveSnapshot(embedObject) {
        const snapshots = this.getSnapshots();
        if (snapshots.length >= NOTEBOOK_SANAPSHOT_MAX_COUNT) {
            snapshots.pop();
        }

        snapshots.shift(embedObject);
        window.localStorage.setItem(NOTEBOOK_SNAPSHOT_STORAGE, JSON.stringify(snapshots));
    }

    getSnapshots() {
        const snapshots = window.localStorage.getItem(NOTEBOOK_SNAPSHOT_STORAGE);

        return JSON.parse(snapshots);
    }

    removeSnapshot() {
        console.log('remove Snapshot');
    }

    removeAllSnapshots() {
        window.localStorage.setItem(NOTEBOOK_SNAPSHOT_STORAGE, JSON.stringify([]));
    }
}

const snapshotContainer = new SnapshotContainer();

export default snapshotContainer;

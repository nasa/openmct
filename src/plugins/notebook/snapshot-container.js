import EventEmitter from 'EventEmitter';
import { EVENT_SNAPSHOTS_UPDATED } from './notebook-constants';

const NOTEBOOK_SNAPSHOT_STORAGE = 'notebook-snapshot-storage';
const NOTEBOOK_SANAPSHOT_MAX_COUNT = 10;

class SnapshotContainer extends EventEmitter {
    constructor() {
        super();

        if (!SnapshotContainer.instance) {
            SnapshotContainer.instance = this;
        }

        return SnapshotContainer.instance;
    }

    saveSnapshot(embedObject) {
        const snapshots = this.getSnapshots();
        if (snapshots.length >= NOTEBOOK_SANAPSHOT_MAX_COUNT) {
            snapshots.pop();
        }

        snapshots.unshift(embedObject);
        window.localStorage.setItem(NOTEBOOK_SNAPSHOT_STORAGE, JSON.stringify(snapshots));
        this.emit(EVENT_SNAPSHOTS_UPDATED, true);
    }

    getSnapshots() {
        const snapshots = window.localStorage.getItem(NOTEBOOK_SNAPSHOT_STORAGE) || '[]';

        return JSON.parse(snapshots);
    }

    removeSnapshot() {
        console.log('TODO: remove Snapshot');
        this.emit(EVENT_SNAPSHOTS_UPDATED, true);
    }

    removeAllSnapshots() {
        console.log('TODO: remove ALL Snapshot');
        window.localStorage.setItem(NOTEBOOK_SNAPSHOT_STORAGE, JSON.stringify([]));
        this.emit(EVENT_SNAPSHOTS_UPDATED, true);
    }
}

const snapshotContainer = new SnapshotContainer();

export default snapshotContainer;

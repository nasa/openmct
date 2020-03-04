import EventEmitter from 'EventEmitter';
import { EVENT_SNAPSHOTS_UPDATED } from './notebook-constants';

const NOTEBOOK_SNAPSHOT_STORAGE = 'notebook-snapshot-storage';
export const NOTEBOOK_SNAPSHOT_MAX_COUNT = 10;

class SnapshotContainer extends EventEmitter {
    constructor() {
        super();

        if (!SnapshotContainer.instance) {
            SnapshotContainer.instance = this;
        }

        return SnapshotContainer.instance;
    }

    addSnapshot(embedObject) {
        const snapshots = this.getSnapshots();
        if (snapshots.length >= NOTEBOOK_SNAPSHOT_MAX_COUNT) {
            snapshots.pop();
        }

        snapshots.unshift(embedObject);
        this.saveSnapshots(snapshots);
    }

    getSnapshot(id) {
        const snapshots = this.getSnapshots();

        return snapshots.find(s => s.id === id);
    }

    getSnapshots() {
        const snapshots = window.localStorage.getItem(NOTEBOOK_SNAPSHOT_STORAGE) || '[]';

        return JSON.parse(snapshots);
    }

    removeSnapshot(id) {
        if (!id) {
            return;
        }

        const snapshots = this.getSnapshots();
        const filteredsnapshots = snapshots.filter(snapshot => snapshot.id !== id);
        this.saveSnapshots(filteredsnapshots);
    }

    removeAllSnapshots() {
        this.saveSnapshots([]);
    }

    saveSnapshots(snapshots) {
        window.localStorage.setItem(NOTEBOOK_SNAPSHOT_STORAGE, JSON.stringify(snapshots));
        this.emit(EVENT_SNAPSHOTS_UPDATED, true);
    }

    updateSnapshot(snapshot) {
        const snapshots = this.getSnapshots();
        const updatedSnapshots = snapshots.map(s => {
            return s.id === snapshot.id
                ? snapshot
                : s;
        });
        this.saveSnapshots(updatedSnapshots);
    }
}

const snapshotContainer = new SnapshotContainer();

export default snapshotContainer;

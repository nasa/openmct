import EventEmitter from 'EventEmitter';
import { EVENT_SNAPSHOTS_UPDATED } from './notebook-constants';
import Painterro from 'painterro';

const NOTEBOOK_SNAPSHOT_STORAGE = 'notebook-snapshot-storage';

export const NOTEBOOK_SNAPSHOT_MAX_COUNT = 5;

export default class SnapshotContainer extends EventEmitter {
    constructor(openmct) {
        super();

        if (!SnapshotContainer.instance) {
            SnapshotContainer.instance = this;
        }

        this.openmct = openmct;
        this.openImageEditor = this.openImageEditor.bind(this);

        return SnapshotContainer.instance;
    }

    addSnapshot(embedObject) {
        const snapshots = this.getSnapshots();
        if (snapshots.length >= NOTEBOOK_SNAPSHOT_MAX_COUNT) {
            snapshots.pop();
        }

        snapshots.unshift(embedObject);

        return this.saveSnapshots(snapshots);
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

        return this.saveSnapshots(filteredsnapshots);
    }

    removeAllSnapshots() {
        return this.saveSnapshots([]);
    }

    saveSnapshots(snapshots) {
        try {
            window.localStorage.setItem(NOTEBOOK_SNAPSHOT_STORAGE, JSON.stringify(snapshots));
            this.emit(EVENT_SNAPSHOTS_UPDATED, true);

            return true;
        } catch (e) {
            const message = 'Insufficient memory in localstorage to store snapshot, please delete some snapshots and try again!';
            this.openmct.notifications.error(message);

            return false;
        }
    }

    updateSnapshot(snapshot) {
        const snapshots = this.getSnapshots();
        const updatedSnapshots = snapshots.map(s => {
            return s.id === snapshot.id
                ? snapshot
                : s;
        });

        return this.saveSnapshots(updatedSnapshots);
    }

    openImageEditor() {
        let painterroDiv = document.createElement('div');
        let painterroInstance = {};
        let save = false;
        let self = this;

        painterroDiv.id = 'snap-annotation';

        let annotateOverlay = this.openmct.overlays.overlay({
            element: painterroDiv,
            size: 'large',
            dismissable: false,
            buttons: [
                {
                    label: 'Cancel',
                    callback: () => {
                        painterroInstance.save();
                        annotateOverlay.dismiss();
                    }
                },
                {
                    label: 'Save',
                    callback: () => {
                        save = true;
                        painterroInstance.save();
                        annotateOverlay.dismiss();
                    }
                }
            ]
        });

        painterroInstance = Painterro({
            id: 'snap-annotation',
            activeColor: '#ff0000',
            activeColorAlpha: 1.0,
            activeFillColor: '#fff',
            activeFillColorAlpha: 0.0,
            backgroundFillColor: '#000',
            backgroundFillColorAlpha: 0.0,
            defaultFontSize: 16,
            defaultLineWidth: 2,
            defaultTool: 'ellipse',
            hiddenTools: ['save', 'open', 'close', 'eraser', 'pixelize', 'rotate', 'settings', 'resize'],
            translation: {
                name: 'en',
                strings: {
                    lineColor: 'Line',
                    fillColor: 'Fill',
                    lineWidth: 'Size',
                    textColor: 'Color',
                    fontSize: 'Size',
                    fontStyle: 'Style'
                }
            },
            saveHandler: (image, done) => {
                if (save) {
                    const url = image.asBlob();
                    const reader = new window.FileReader();
                    reader.readAsDataURL(url);
                    reader.onloadend = function () {
                        const snapshot = reader.result;
                        const snapshotObject = {
                            src: snapshot,
                            type: url.type,
                            size: url.size,
                            modified: Date.now()
                        };
                        const embedObject = {
                            snapshot: snapshotObject
                        };

                        self.addSnapshot(embedObject);
                    };
                } else {
                    console.log('You cancelled the annotation!!!');
                }

                done(true);
            }
        }).show();
    }
}

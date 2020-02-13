import Moment from 'moment';

export default class EntryController {
    constructor(openmct, domainObject) {
        console.log('EntryController');
        this.openmct = openmct;
        this.domainObject = domainObject;

        this.currentEntryValue = '';
        this.exposedData = this.exposedData.bind(this);
        this.exposedMethods = this.exposedMethods.bind(this);
    }

    entryPosById(entryId) {
        let foundId = -1;

        this.domainObject.entries.forEach((element, index) => {
            if (element.id === entryId) {
                foundId = index;

                return;
            }
        });

        return foundId;
    }

    textFocus($event) {
        if ($event.target) {
            this.currentEntryValue = $event.target.innerText;
        } else {
            $event.target.innerText = '';
        }
    }

    textBlur($event, entryId) {
        if (!$event.target) {
            return;
        }

        const entryPos = this.entryPosById(entryId);

        if (this.currentEntryValue !== $event.target.innerText) {
            this.openmct.objects.mutate(this.domainObject, 'entries[' + entryPos + '].text', $event.target.innerText);
        }
    }

    formatTime(unixTime, timeFormat) {
        return Moment(unixTime).format(timeFormat);
    }

    deleteEntry() {
        const entryPos = this.entryPosById(this.entry.id),
            domainObject = this.domainObject,
            openmct = this.openmct;

        if (entryPos !== -1) {
            const dialog = this.openmct.overlays.dialog({
                iconClass: 'alert',
                message: 'This action will permanently delete this entry. Do you wish to continue?',
                buttons: [
                    {
                        label: "Ok",
                        emphasis: true,
                        callback: function () {
                            domainObject.entries.splice(entryPos, 1);
                            openmct.objects.mutate(domainObject, 'entries', domainObject.entries);
                            dialog.dismiss();
                        }
                    },
                    {
                        label: "Cancel",
                        callback: function () {
                            dialog.dismiss();
                        }
                    }
                ]
            });
        }
    }

    dropOnEntry(entryid, event) {
        const data = event.dataTransfer.getData('openmct/domain-object-path');

        if (data) {
            const objectPath = JSON.parse(data),
                domainObject = objectPath[0],
                domainObjectKey = domainObject.identifier.key,
                domainObjectType = this.openmct.types.get(domainObject.type),
                cssClass = domainObjectType && domainObjectType.definition ?
                    domainObjectType.definition.cssClass : 'icon-object-unknown',
                entryPos = this.entryPosById(entryid),
                currentEntryEmbeds = this.domainObject.entries[entryPos].embeds,
                newEmbed = {
                    id: '' + Date.now(),
                    domainObject: domainObject,
                    objectPath: objectPath,
                    type: domainObjectKey,
                    cssClass: cssClass,
                    name: domainObject.name,
                    snapshot: ''
                };
            currentEntryEmbeds.push(newEmbed);
            this.openmct.objects.mutate(this.domainObject, 'entries[' + entryPos + '].embeds', currentEntryEmbeds);
        }
    }

    exposedData() {
        return {
            openmct: this.openmct,
            domainObject: this.domainObject,
            currentEntryValue: this.currentEntryValue
        };
    }

    exposedMethods() {
        return {
            entryPosById: this.entryPosById,
            textFocus: this.textFocus,
            textBlur: this.textBlur,
            formatTime: this.formatTime,
            deleteEntry: this.deleteEntry,
            dropOnEntry: this.dropOnEntry
        };
    }
}

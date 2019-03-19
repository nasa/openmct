<template>
<div class="c-properties c-properties--location">
    <div class="c-properties__header" title="The location of this linked object.">Location</div>
    <ul class="c-properties__section">
        <li class="c-properties__row">
            <div class="c-properties__label">This Link</div>
            <div class="c-properties__value">TODO</div>
        </li>
        <li class="c-properties__row" v-if="originalLocation.length">
            <div class="c-properties__label">Original</div>
            <ul class="c-properties__value">
                <li v-for="item in originalLocation"
                    :key="item.key">
                    <object-label 
                        :domainObject="item.domainObject"
                        :objectPath="item.objectPath">
                    </object-label>
                    <span class="c-disclosure-triangle"></span>
                </li>
            </ul>
        </li>
    </ul>
</div>
</template>

<script>

import ObjectLabel from '../components/ObjectLabel.vue';

export default {
    inject: ['openmct'],
    components: {
        ObjectLabel
    },
    data() {
        return {
            domainObject: {},
            originalLocation: [],
            linkLocation: '',
            keyString: ''
        }
    },
    mounted() {
        this.objectService = this.openmct.$injector.get('objectService');
        this.openmct.selection.on('change', this.updateSelection);
        this.updateSelection(this.openmct.selection.get());
    },
    beforeDestroy() {
        this.openmct.selection.off('change', this.updateSelection);
    },
    methods: {
        getObjectPath(domainObject) {
            let objectPath = [],
                context = domainObject.getCapability('context');

            if (context) {
                objectPath = context.getPath();
            }

            return objectPath;
        },
        setLinkAndOriginalLocation(domainObjects) {
            let oldStyleDomainObject = domainObjects[this.keyString],
                objectPath = this.getObjectPath(oldStyleDomainObject)
                    .slice(1,-1)
                    .map((d) => {
                        let newStyleDomainObject = d.useCapability('adapter');
                        return this.openmct.objects.makeKeyString(newStyleDomainObject.identifier);
                    });

            this.objectService.getObjects(objectPath)
                .then((object) => {
                    let objectArray = Object.values(object);

                    this.originalLocation = objectArray.map((d) => {
                        let domainObject = d.useCapability('adapter'),
                            key = this.openmct.objects.makeKeyString(domainObject.identifier),
                            childObjectPath = this.getObjectPath(d)
                                .slice(1)
                                .reverse()
                                .map((dd) => dd.useCapability('adapter'));

                        return {
                            domainObject,
                            key,
                            objectPath: childObjectPath 
                        }
                    });

                let parent = this.originalLocation[1];

                if (parent && this.domainObject.location !== this.openmct.objects.makeKeyString(parent.domainObject.identifier)) {
                    this.linkLocation = this.domainObject.location;
                }
            });
        },
        updateSelection(selection) {
            if (selection.length === 0) {
                this.domainObject = {};
                this.originalLocation = [];
                this.linkLocation = '';
                return;
            }

            this.domainObject = selection[0].context.item;
            
            let keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

            if (this.keyString !== keyString) {
                this.keyString = keyString;

                this.objectService
                    .getObjects([keyString])
                    .then(this.setLinkAndOriginalLocation);
            }
        }
    }
}
</script>

<template>
<div class="c-properties c-properties--location">
    <div class="c-properties__header" title="The location of this linked object.">Location</div>
    <ul class="c-properties__section">
        <li class="c-properties__row" v-if="originalPath.length">
            <div class="c-properties__label">Original</div>
            <ul class="c-properties__value">
                <li v-for="pathObject in originalPath"
                    :key="pathObject.key">
                    <object-label
                        v-if="parentObjects[pathObject.key]"
                        :domainObject="parentObjects[pathObject.key].domainObject"
                        :objectPath="parentObjects[pathObject.key].objectPath">
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
            originalPath: [],
            parentObjects: {},
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
        makeParentObjects() {
            this.originalPath.forEach((pathObject) => {
                this.openmct.objects.getOriginalPath(pathObject.key)
                    .then(path => {
                        this.$set(
                            this.parentObjects,
                            pathObject.key,
                            {
                                domainObject: pathObject.domainObject,
                                key: pathObject.key,
                                objectPath: path.slice(1).reverse()
                            }
                        );
                    })
            });
        },
        setOriginalPath(path) {
            this.originalPath = path.slice(1,-1).map(domainObject => {
                let key = this.openmct.objects.makeKeyString(domainObject.identifier);
                return {
                    domainObject,
                    key
                }
            });
            this.makeParentObjects();
        },
        updateSelection(selection) {
            if (selection.length === 0) {
                this.domainObject = {};
                this.originalLocation = [];
                return;
            }

            this.domainObject = selection[0].context.item;
            
            let keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

            if (this.keyString !== keyString) {
                this.keyString = keyString;
                this.originalPath = [];
                this.parentObjects = {};

                this.openmct.objects.getOriginalPath(this.keyString)
                    .then(this.setOriginalPath);
            }
        }
    }
}
</script>

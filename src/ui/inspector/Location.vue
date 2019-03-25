<template>
<div class="c-properties c-properties--location">
    <div class="c-properties__header" title="The location of this linked object.">Original Location</div>
    <ul class="c-properties__section">
        <li class="c-properties__row" v-if="originalPath.length">
            <ul class="c-properties__value">
                <li v-for="pathObject in orderedOriginalPath"
                    :key="pathObject.key">
                    <object-label
                        :domainObject="pathObject.domainObject"
                        :objectPath="pathObject.objectPath">
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
            keyString: ''
        }
    },
    mounted() {
        this.openmct.selection.on('change', this.updateSelection);
        this.updateSelection(this.openmct.selection.get());
    },
    beforeDestroy() {
        this.openmct.selection.off('change', this.updateSelection);
    },
    methods: {
        setOriginalPath(path, skipSlice) {
            let originalPath = path;

            if (!skipSlice) {
                originalPath = path.slice(1,-1);
            }

            this.originalPath = originalPath.map((domainObject, index, pathArray) => {
                let key = this.openmct.objects.makeKeyString(domainObject.identifier);
                return {
                    domainObject,
                    key,
                    objectPath: pathArray.slice(index)
                }
            });
        },
        clearData() {
            this.domainObject = {};
            this.originalPath = [];
            this.keyString = '';
        },
        updateSelection(selection) {
            if (!selection.length) {
                this.clearData();
                return;
            } else if (!selection[0].context.item && selection[1] && selection[1].context.item) {
                this.setOriginalPath([selection[1].context.item], true);
                return;
            }

            this.domainObject = selection[0].context.item;

            let keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

            if (keyString && this.keyString !== keyString) {
                this.keyString = keyString;
                this.originalPath = [];

                this.openmct.objects.getOriginalPath(this.keyString)
                    .then(this.setOriginalPath);
            }
        }
    },
    computed: {
        orderedOriginalPath() {
            return this.originalPath.reverse();
        }
    }
}
</script>

<template>
<a class="c-tree__item__label"
    draggable="true"
    @dragstart="dragStart"
    @click="navigateOrPreview"
    :href="objectLink">
    <div class="c-tree__item__type-icon"
        :class="typeClass"></div>
    <div class="c-tree__item__name">{{ observedObject.name }}</div>
</a>
</template>

<script>

import ObjectLink from '../mixins/object-link';
import ContextMenuGesture from '../mixins/context-menu-gesture';
import PreviewAction from '../preview/PreviewAction.js';

export default {
    mixins: [ObjectLink, ContextMenuGesture],
    inject: ['openmct'],
    props: {
        domainObject: Object,
        'objectPath': {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        return {
            observedObject: this.domainObject
        };
    },
    mounted() {
        if (this.observedObject) {
            let removeListener = this.openmct.objects.observe(this.observedObject, '*', (newObject) => {
                this.observedObject = newObject;
            });
            this.$once('hook:destroyed', removeListener);
        }
        this.previewAction = new PreviewAction(this.openmct);
    },
    computed: {
        typeClass() {
            let type = this.openmct.types.get(this.observedObject.type);
            if (!type) {
                return 'icon-object-unknown';
            }
            return type.definition.cssClass;
        }
    },
    methods: {
        navigateOrPreview(event) {
            if (this.openmct.editor.isEditing()){
                event.preventDefault();
                this.preview();
            }
        },
        preview() {
            if (this.previewAction.appliesTo(this.objectPath)){
                this.previewAction.invoke(this.objectPath);
            }
        },
        dragStart(event) {
            event.dataTransfer.setData("domainObject", JSON.stringify(this.observedObject));
        }
    }
}
</script>

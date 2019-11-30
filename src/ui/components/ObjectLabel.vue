<template>
<a class="c-tree__item__label c-object-label"
    draggable="true"
    @dragstart="dragStart"
    @click="navigateOrPreview"
    :href="objectLink">
    <div class="c-tree__item__type-icon c-object-label__type-icon"
        :class="typeClass"></div>
    <div class="c-tree__item__name c-object-label__name">{{ observedObject.name }}</div>
</a>
</template>

<style lang="scss">    .c-object-label {
        // <a> tag and draggable element that holds type icon and name.
        // Used mostly in trees and lists
        border-radius: $controlCr;
        display: flex;
        align-items: center;
        flex: 1 1 auto;
        overflow: hidden;
        padding: $interiorMarginSm 1px;
        white-space: nowrap;

        &__name {
            @include ellipsize();
            display: inline;
            color: $colorItemTreeFg;
            width: 100%;
        }

        &__type-icon {
            // Type icon. Must be an HTML entity to allow inclusion of alias indicator.
            display: block;
            flex: 0 0 auto;
            font-size: 1.3em;
            margin-right: $interiorMarginSm;
            color: $colorItemTreeIcon;
            width: $treeTypeIconW;
        }
    }
</style>


<script>

import ObjectLink from '../mixins/object-link';
import ContextMenuGesture from '../mixins/context-menu-gesture';
import PreviewAction from '../preview/PreviewAction.js';

export default {
    mixins: [ObjectLink, ContextMenuGesture],
    inject: ['openmct'],
    props: {
        domainObject: Object,
        objectPath: {
            type: Array,
            default() {
                return [];
            }
        },
        navigateToPath: String
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
            let navigatedObject = this.openmct.router.path[0];
            let serializedPath = JSON.stringify(this.objectPath);
            let keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

            /*
             * Cannot inspect data transfer objects on dragover/dragenter so impossible to determine composability at
             * that point. If dragged object can be composed by navigated object, then indicate with presence of 
             * 'composable-domain-object' in data transfer
             */
            if (this.openmct.composition.checkPolicy(navigatedObject, this.observedObject)) {
                event.dataTransfer.setData("openmct/composable-domain-object", JSON.stringify(this.domainObject));
            }
            // serialize domain object anyway, because some views can drag-and-drop objects without composition 
            // (eg. notabook.)
            event.dataTransfer.setData("openmct/domain-object-path", serializedPath);
            event.dataTransfer.setData(`openmct/domain-object/${keyString}`, this.domainObject);
        }
    }
}
</script>

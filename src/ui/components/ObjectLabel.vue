<template>
<a
    class="c-tree__item__label c-object-label"
    :class="[statusClass]"
    draggable="true"
    :href="objectLink"
    @dragstart="dragStart"
    @click="navigateOrPreview"
>
    <div
        class="c-tree__item__type-icon c-object-label__type-icon"
        :class="typeClass"
    >
        <span class="is-status__indicator"
              :title="`This item is ${status}`"
        ></span>
    </div>
    <div class="c-tree__item__name c-object-label__name">
        {{ observedObject.name }}
    </div>
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
        domainObject: {
            type: Object,
            required: true
        },
        objectPath: {
            type: Array,
            required: true
        },
        navigateToPath: {
            type: String,
            default: undefined
        },
        liteObject: {
            type: Boolean,
            default: false
        },
        beforeInteraction: {
            type: Function,
            required: false,
            default: undefined
        }
    },
    data() {
        return {
            observedObject: this.domainObject,
            status: ''
        };
    },
    computed: {
        typeClass() {
            let domainObjectType = this.liteObject ? this.domainObject.type : this.observedObject.type;
            let type = this.openmct.types.get(domainObjectType);
            if (!type) {
                return 'icon-object-unknown';
            }

            return type.definition.cssClass;
        },
        statusClass() {
            return (this.status) ? `is-status--${this.status}` : '';
        }
    },
    mounted() {
        // if it's a liteObject nothing to observe
        if (this.observedObject && !this.liteObject) {
            let removeListener = this.openmct.objects.observe(this.observedObject, '*', (newObject) => {
                this.observedObject = newObject;
            });
            this.$once('hook:destroyed', removeListener);
        }

        // liteObjects do have identifiers, so statuses can be observed
        this.removeStatusListener = this.openmct.status.observe(this.observedObject.identifier, this.setStatus);
        this.status = this.openmct.status.get(this.observedObject.identifier);
        this.previewAction = new PreviewAction(this.openmct);
    },
    destroyed() {
        this.removeStatusListener();
    },
    methods: {
        async navigateOrPreview(event) {
            // skip if editing or is a lite object with an interaction function
            if (this.openmct.editor.isEditing() || !(this.liteObject && this.beforeInteraction)) {
                return;
            }

            event.preventDefault();

            if (this.openmct.editor.isEditing()) {
                this.preview();
            } else if (this.liteObject && this.beforeInteraction) {
                let fullObjectInfo = await this.getFullObjectInfo();
                // need to update when new route functions are merged (back button PR)
                window.location.href = '#/browse/' + fullObjectInfo.navigationPath;
            }
        },
        async preview() {
            let objectPath = this.objectPath;

            if (this.liteObject && this.beforeInteraction) {
                let fullObjectInfo = await this.getFullObjectInfo();
                objectPath = fullObjectInfo.objectPath;
            }

            if (this.previewAction.appliesTo(objectPath)) {
                this.previewAction.invoke(objectPath);
            }
        },
        dragStart(event) {
            const LITE_DOMAIN_OBJECT_TYPE = "openmct/domain-object-lite";

            let navigatedObject = this.openmct.router.path[0];
            let keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            let serializedPath = JSON.stringify(this.objectPath);

            if (this.liteObject) {
                event.dataTransfer.setData(LITE_DOMAIN_OBJECT_TYPE, JSON.stringify(this.domainObject.identifier));

            } else {

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
        },
        async getFullObjectInfo() {
            let fullObjectInfo = await this.beforeInteraction();
            let objectPath = fullObjectInfo.objectPath;
            let navigationPath = objectPath
                .reverse()
                .map(object =>
                    this.openmct.objects.makeKeyString(object.identifier)
                ).join('/');

            fullObjectInfo.objectPath = objectPath;
            fullObjectInfo.navigationPath = navigationPath;

            return fullObjectInfo;
        },
        setStatus(status) {
            this.status = status;
        }
    }
};
</script>

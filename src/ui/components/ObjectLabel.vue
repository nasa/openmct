<template>
<a class="c-tree__item__label"
    draggable="true"
    @dragstart="dragStart"
    :href="objectLink">
    <div class="c-tree__item__type-icon"
        :class="typeClass"></div>
    <div class="c-tree__item__name">{{ observedObject.name }}</div>
</a>
</template>

<script>

import ObjectLink from '../mixins/object-link';
import ContextMenuGesture from '../mixins/context-menu-gesture';

export default {
    mixins: [ObjectLink, ContextMenuGesture],
    inject: ['openmct'],
    props: {
        domainObject: Object
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
        dragStart(event) {
            let navigatedObject = this.openmct.router.path[0];
            let serializedObject = JSON.stringify(this.observedObject);
            if (this.openmct.composition.checkPolicy(navigatedObject, this.observedObject)) {
                event.dataTransfer.setData("openmct/composable-domain-object", serializedObject);
            }
            event.dataTransfer.setData("openmct/domain-object", serializedObject);
        }
    }
}
</script>

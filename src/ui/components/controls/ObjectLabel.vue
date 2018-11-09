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

import ContextMenu from '../mixins/context-menu';
import ObjectLink from '../mixins/object-link';

export default {
    mixins: [ContextMenu, ObjectLink],
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
            event.dataTransfer.setData("domainObject", JSON.stringify(this.observedObject));
        }
    }
}
</script>

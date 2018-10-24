<template>
<a class="c-tree__item__label"
    draggable="true"
    @dragstart="dragStart"
    :href="urlLink">
    <div class="c-tree__item__type-icon"
        :class="cssClass"></div>
    <div class="c-tree__item__name">{{ domainObject.name }}</div>
</a>
</template>

<script>

export default {
    inject: ['openmct'],
    props: {
        'domainObject': Object,
        'path': Array
    },
    computed: {
        urlLink() {
            if (!this.path) {
                return;
            }
            return '#/browse/' + this.path
                .map(o => this.openmct.objects.makeKeyString(o))
                .join('/');
        }
    },
    data() {
        return {
            cssClass: 'icon-object-unknown'
        }
    },
    mounted() {
        let type = this.openmct.types.get(this.domainObject.type);

        if (type.definition.cssClass) {
            this.cssClass = type.definition.cssClass;
        } else {
            console.log("Failed to get typeDef.cssClass for object", this.domainObject.name, this.domainObject.type);
        }
    },
    methods: {
        dragStart(event) {
            event.dataTransfer.setData("domainObject", JSON.stringify(this.domainObject));
        }
    },
    destroyed() {
    }
}
</script>

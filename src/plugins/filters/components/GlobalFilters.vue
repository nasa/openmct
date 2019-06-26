<template>
    <li>
        <div class="c-tree__item menus-to-left"
            @click="toggleExpanded">
            <span class="c-disclosure-triangle is-enabled flex-elem"
                :class="{'c-disclosure-triangle--expanded': expanded}"></span>
            <div class="c-tree__item__label">
                <div class="c-object-label">
                    <div class="c-object-label__type-icon"></div>
                    <div class="c-object-label__name flex-elem grows">Global Filtering</div>
                </div>
            </div>
        </div>
        <ul class="grid-properties" v-if="expanded">
           <!--  <filter-field>
                
            </filter-field> -->
        </ul>
    </li>
</template>

<script>
    import FilterField from './FilterField.vue';

    export default {
        inject: ['openmct'],
        components: {
            FilterField
        },
        props: ['filters'],
        data() {
            return {
                expanded: false
            }
        },
        methods: {
            toggleExpanded() {
                this.expanded = !this.expanded;
            }
        },
        mounted() {

        }
    }
</script>
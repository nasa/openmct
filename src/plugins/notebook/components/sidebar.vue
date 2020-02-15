<template>
<div class="c-sidebar">
    <div class="c-sidebar__header">
        <span class="title">{{ domainObject.configuration.sectionTitle }}</span>
        <span class="title">
            {{ domainObject.configuration.pageTitle }}
            <button class="l-pane__collapse-button c-button"
                    @click="toggleCollapse"
            ></button>
        </span>
    </div>
    <div class="c-sidebar__contents">
        <SectionCollection :sections="sections"
                           :domain-object="domainObject"
        />
        <div class="divider"></div>
        <PageCollection :pages="pages"
                        :domain-object="domainObject"
        />
    </div>
</div>
</template>

<script>
import SectionCollection from './section-collection.vue';
import PageCollection from './page-collection.vue';

export default {
    inject: ['openmct'],
    components: {
        SectionCollection,
        PageCollection
    },
    props: {
        domainObject: {
            type: Object,
            required: true
        },
        pages: {
            type: Array,
            required: true,
            default() {
                return [];
            }
        }
    },
    data() {
        return {
            collapsed: false,
            entrySearch:'',
            search:'',
            sections: this.domainObject.sections,
            showTime:0,
            sortEntries: this.domainObject.configuration.defaultSort
        }
    },
    watch: {
        domainObject(newDomainObject) {
            this.sections = newDomainObject.sections;
        },
        pages(newpages) {
        }
    },
    mounted() {
    },
    destroyed() {
    },
    methods: {
        toggleCollapse: function () {
            this.collapsed = !this.collapsed;

            // if (this.collapsed) {
            //     this.currentSize = (this.dragCollapse === true)? this.initial : this.$el.style[this.styleProp];
            //     this.$el.style[this.styleProp] = '';
            // } else {
            //     // Pane is collapsed and is being expanded
            //     this.$el.style[this.styleProp] = this.currentSize;
            //     delete this.currentSize;
            //     delete this.dragCollapse;
            // }
        }
    }
}
</script>

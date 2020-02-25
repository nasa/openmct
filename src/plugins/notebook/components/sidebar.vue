<template>
<div class="c-sidebar">
    <div class="c-sidebar__header">
        <span class="title">{{ sectionTitle }}</span>
        <span class="title">
            {{ pageTitle }}
            <button class="l-pane__collapse-button c-button"
                    @click="toggleCollapse"
            ></button>
        </span>
    </div>
    <div class="c-sidebar__contents">
        <SectionCollection :domain-object="domainObject"
                           :sections="sections"
                           :section-title="sectionTitle"
        />
        <div class="divider"></div>
        <PageCollection :domain-object="domainObject"
                        :pages="pages"
                        :sections="sections"
                        :page-title="pageTitle"
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
            default() {
                return {};
            }
        },
        pages: {
            type: Array,
            required: true,
            default() {
                return [];
            }
        },
        pageTitle: {
            type: String,
            default() {
                return '';
            }
        },
        sections: {
            type: Array,
            required: true,
            default() {
                return [];
            }
        },
        sectionTitle: {
            type: String,
            default() {
                return '';
            }
        }
    },
    data() {
        return {
            collapsed: false
        }
    },
    watch: {
        pages(newpages) {
        },
        sections(newSections) {
        }
    },
    mounted() {
    },
    destroyed() {
    },
    methods: {
        toggleCollapse: function () {
            this.collapsed = !this.collapsed;

            console.log('TODO: Sidebar toggleCollapse');
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

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
        <button @click="addSection">+ Add {{ sectionTitle }}</button>
        <SectionCollection :domain-object="domainObject"
                           :sections="sections"
                           :section-title="sectionTitle"
        />
        <div class="divider"></div>
        <button @click="addPage">+ Add {{ pageTitle }}</button>
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
import { EVENT_UPDATE_PAGE, EVENT_UPDATE_SECTION } from '../notebook-constants';
import uuid from 'uuid';

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
            if (!newpages.length) {
                this.addPage();
            }
        },
        sections(newSections) {
            if (!newSections.length) {
                this.addSection();
            }
        }
    },
    mounted() {
        if (!this.sections.length) {
            this.addSection();
        }
    },
    destroyed() {
    },
    methods: {
        addPage() {
            const pageTitle = this.pageTitle;
            const page = {
                id : uuid(),
                isDefault : false,
                isSelected: true,
                name : `Unnamed ${pageTitle}`,
                pageTitle
            };

            this.pages.forEach(p => p.isSelected = false);
            const pages = this.pages.concat(page);
            this.$emit(EVENT_UPDATE_PAGE, { pages });
        },
        addSection() {
            const sectionTitle = this.sectionTitle;
            const id = uuid();
            const section = {
                id,
                isDefault : false,
                isSelected: true,
                name : `Unnamed ${sectionTitle}`,
                pages : [],
                sectionTitle
            };

            this.sections.forEach(s => s.isSelected = false);
            const sections = this.sections.concat(section);
            this.$emit(EVENT_UPDATE_SECTION, { sections });
        },
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

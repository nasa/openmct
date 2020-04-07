<template>
<div class="c-sidebar c-drawer c-drawer--align-left">
    <div class="c-sidebar__pane">
        <div class="c-sidebar__header-w">
            <div class="c-sidebar__header">
                <span class="c-sidebar__header-label">{{ sectionTitle }}</span>
            </div>
        </div>
        <div class="c-sidebar__contents-and-controls">
            <button class="c-list-button"
                    @click="addSection"
            >
                <span class="c-button c-list-button__button icon-plus"></span>
                <span class="c-list-button__label">Add {{ sectionTitle }}</span>
            </button>
            <SectionCollection class="c-sidebar__contents"
                               :default-section-id="defaultSectionId"
                               :domain-object="domainObject"
                               :sections="sections"
                               :section-title="sectionTitle"
                               @updateSection="updateSection"
            />
        </div>
    </div>
    <div class="c-sidebar__pane">
        <div class="c-sidebar__header-w">
            <div class="c-sidebar__header">
                <span class="c-sidebar__header-label">{{ pageTitle }}</span>
            </div>
            <button class="c-click-icon c-click-icon--major icon-x-in-circle"
                    @click="toggleNav"
            ></button>
        </div>

        <div class="c-sidebar__contents-and-controls">
            <button class="c-list-button"
                    @click="addPage"
            >
                <span class="c-button c-list-button__button icon-plus"></span>
                <span class="c-list-button__label">Add {{ pageTitle }}</span>
            </button>
            <PageCollection ref="pageCollection"
                            class="c-sidebar__contents"
                            :default-page-id="defaultPageId"
                            :domain-object="domainObject"
                            :pages="pages"
                            :sections="sections"
                            :sidebar-covers-entries="sidebarCoversEntries"
                            :page-title="pageTitle"
                            @toggleNav="toggleNav"
                            @updatePage="updatePage"
            />
        </div>
    </div>
</div>
</template>

<script>
import SectionCollection from './section-collection.vue';
import PageCollection from './page-collection.vue';
import uuid from 'uuid';

export default {
    inject: ['openmct'],
    components: {
        SectionCollection,
        PageCollection
    },
    props: {
        defaultPageId: {
            type: String,
            default() {
                return '';
            }
        },
        defaultSectionId: {
            type: String,
            default() {
                return '';
            }
        },
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
        },
        sidebarCoversEntries: {
            type: Boolean,
            default() {
                return false;
            }
        }
    },
    data() {
        return {
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
    methods: {
        addPage() {
            const pageTitle = this.pageTitle;
            const id = uuid();
            const page = {
                id,
                isDefault : false,
                isSelected: true,
                name : `Unnamed ${pageTitle}`,
                pageTitle
            };

            this.pages.forEach(p => p.isSelected = false);
            const pages = this.pages.concat(page);

            this.updatePage({ pages, id });
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

            this.updateSection({ sections, id });
        },
        toggleNav() {
            this.$emit('toggleNav');
        },
        updatePage({ pages, id }) {
            this.$emit('updatePage', { pages, id });
        },
        updateSection({ sections, id }) {
            this.$emit('updateSection', { sections, id });
        }
    }
}
</script>

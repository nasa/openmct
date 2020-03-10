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
            />
        </div>
    </div>
</div>
</template>

<script>
import SectionCollection from './section-collection.vue';
import PageCollection from './page-collection.vue';
import { EVENT_UPDATE_PAGE, EVENT_UPDATE_SECTION, TOGGLE_NAV } from '../notebook-constants';
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
        this.$refs.pageCollection.$on(TOGGLE_NAV, () => this.$emit(TOGGLE_NAV));
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
        toggleNav: function () {
            this.$parent.toggleNav();
        }
    }
}
</script>

<template>
<div class="c-sidebar c-drawer c-drawer--align-left">
    <div class="c-sidebar__pane js-sidebar-sections">
        <div class="c-sidebar__header-w">
            <div class="c-sidebar__header">
                <span class="c-sidebar__header-label">{{ sectionTitle }}</span>
                <button
                    class="c-icon-button c-icon-button--major icon-plus"
                    @click="addSection"
                >
                    <span class="c-list-button__label">Add</span>
                </button>
            </div>
        </div>
        <div class="c-sidebar__contents-and-controls">
            <SectionCollection
                class="c-sidebar__contents"
                :default-section-id="defaultSectionId"
                :selected-section-id="selectedSectionId"
                :domain-object="domainObject"
                :sections="sections"
                :section-title="sectionTitle"
                @defaultSectionDeleted="defaultSectionDeleted"
                @updateSection="sectionsChanged"
                @selectSection="selectSection"
            />
        </div>
    </div>
    <div class="c-sidebar__pane js-sidebar-pages">
        <div class="c-sidebar__header-w">
            <div class="c-sidebar__header">
                <span class="c-sidebar__header-label">{{ pageTitle }}</span>

                <button
                    class="c-icon-button c-icon-button--major icon-plus"
                    @click="addPage"
                >
                    <span class="c-icon-button__label">Add</span>
                </button>
            </div>
        </div>

        <div class="c-sidebar__contents-and-controls">
            <PageCollection
                ref="pageCollection"
                class="c-sidebar__contents"
                :default-page-id="defaultPageId"
                :selected-page-id="selectedPageId"
                :domain-object="domainObject"
                :pages="pages"
                :sections="sections"
                :sidebar-covers-entries="sidebarCoversEntries"
                :page-title="pageTitle"
                @defaultPageDeleted="defaultPageDeleted"
                @toggleNav="toggleNav"
                @updatePage="pagesChanged"
                @selectPage="selectPage"
            />
        </div>
    </div>
    <div class="c-sidebar__right-edge">
        <button
            class="c-icon-button c-icon-button--major icon-line-horz"
            @click="toggleNav"
        ></button>
    </div>
</div>
</template>

<script>
import SectionCollection from './SectionCollection.vue';
import PageCollection from './PageCollection.vue';
import { v4 as uuid } from 'uuid';

export default {
    components: {
        SectionCollection,
        PageCollection
    },
    inject: ['openmct'],
    props: {
        defaultPageId: {
            type: String,
            default() {
                return '';
            }
        },
        selectedPageId: {
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
        selectedSectionId: {
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
    computed: {
        pages() {
            const selectedSection = this.sections.find(section => section.id === this.selectedSectionId);

            return selectedSection && selectedSection.pages || [];
        }
    },
    watch: {
        pages(newPages) {
            if (!newPages.length) {
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
            const newPage = this.createNewPage();
            const pages = this.addNewPage(newPage);

            this.pagesChanged({
                pages,
                id: newPage.id
            });
            this.$emit('selectPage', newPage.id);
        },
        addSection() {
            const newSection = this.createNewSection();
            const sections = this.addNewSection(newSection);

            this.sectionsChanged({
                sections,
                id: newSection.id
            });

            this.$emit('selectSection', newSection.id);
        },
        addNewPage(page) {
            const pages = this.pages.map(p => {
                p.isSelected = false;

                return p;
            });

            return pages.concat(page);
        },
        addNewSection(section) {
            const sections = this.sections.map(s => {
                s.isSelected = false;

                return s;
            });

            return sections.concat(section);
        },
        createNewPage() {
            const pageTitle = this.pageTitle;
            const id = uuid();

            return {
                id,
                isDefault: false,
                isSelected: true,
                name: `Unnamed ${pageTitle}`,
                pageTitle
            };
        },
        createNewSection() {
            const sectionTitle = this.sectionTitle;
            const id = uuid();
            const page = this.createNewPage();
            const pages = [page];

            return {
                id,
                isDefault: false,
                isSelected: true,
                name: `Unnamed ${sectionTitle}`,
                pages,
                sectionTitle
            };
        },
        defaultPageDeleted() {
            this.$emit('defaultPageDeleted');
        },
        defaultSectionDeleted() {
            this.$emit('defaultSectionDeleted');
        },
        toggleNav() {
            this.$emit('toggleNav');
        },
        pagesChanged({ pages, id }) {
            this.$emit('pagesChanged', {
                pages,
                id
            });
        },
        selectPage(pageId) {
            this.$emit('selectPage', pageId);
        },
        selectSection(sectionId) {
            this.$emit('selectSection', sectionId);
        },
        sectionsChanged({ sections, id }) {
            this.$emit('sectionsChanged', {
                sections,
                id
            });
        }
    }
};
</script>

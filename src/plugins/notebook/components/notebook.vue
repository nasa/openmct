<template>
<div class="c-notebook">
    <div class="c-notebook__head">
        <Search class="c-notebook__search"
                :value="search"
                @input="throttledSearchItem"
                @clear="throttledSearchItem"
        />
    </div>
    <SearchResults v-if="search.length"
                   ref="searchResults"
                   :results="getSearchResults()"
    />

    <div v-if="!search.length"
         class="c-notebook__body"
    >
        <Sidebar ref="sidebar"
                 class="c-notebook__nav c-sidebar c-drawer c-drawer--align-left"
                 :class="[{'is-expanded': showNav}, {'c-drawer--cover': sidebarCoversEntries}]"
                 :domain-object="internalDomainObject"
                 :page-title="internalDomainObject.configuration.pageTitle"
                 :pages="pages"
                 :section-title="internalDomainObject.configuration.sectionTitle"
                 :sections="sections"
                 :sidebar-covers-entries="sidebarCoversEntries"
        />
        <div class="c-notebook__page-view">
            <div class="c-notebook__page-view__header">
                <button class="c-notebook__toggle-nav-button c-icon-button c-icon-button--major icon-menu-hamburger"
                        @click="toggleNav"
                ></button>
                <div class="c-notebook__page-view__path c-path">
                    <span class="c-notebook__path__section c-path__item">
                        {{ getSelectedSection() ? getSelectedSection().name : '' }}
                    </span>
                    <span class="c-notebook__path__page c-path__item">
                        {{ getSelectedPage() ? getSelectedPage().name : '' }}
                    </span>
                </div>
                <div class="c-notebook__page-view__controls">
                    <select v-model="showTime"
                            class="c-notebook__controls__time"
                    >
                        <option value="0"
                                selected="selected"
                        >
                            Show all
                        </option>
                        <option value="1">Last hour</option>
                        <option value="8">Last 8 hours</option>
                        <option value="24">Last 24 hours</option>
                    </select>
                    <select v-model="defaultSort"
                            class="c-notebook__controls__time"
                    >
                        <option value="newest"
                                :selected="defaultSort === 'newest'"
                        >Newest first</option>
                        <option value="oldest"
                                :selected="defaultSort === 'oldest'"
                        >Oldest first</option>
                    </select>
                </div>
            </div>
            <div class="c-notebook__drag-area icon-plus"
                 @click="newEntry($event)"
                 @drop="newEntry($event)"
            >
                <span class="c-notebook__drag-area__label">To start a new entry, click here or drag and drop any object</span>
            </div>
            <div v-if="selectedSection && selectedPage"
                 class="c-notebook__entries"
            >
                <ul>
                    <NotebookEntry v-for="entry in filteredAndSortedEntries"
                                   :key="entry.key"
                                   :entry="entry"
                                   :domain-object="internalDomainObject"
                                   :selected-page="getSelectedPage()"
                                   :selected-section="getSelectedSection()"
                                   :read-only="false"
                    />
                </ul>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import NotebookEntry from './notebook-entry.vue';
import Search from '@/ui/components/search.vue';
import SearchResults from './search-results.vue';
import Sidebar from './sidebar.vue';
import { getDefaultNotebook, setDefaultNotebook } from '../utils/notebook-storage';
import { addNotebookEntry, getNotebookEntries } from '../utils/notebook-entries';
import { EVENT_CHANGE_SECTION_PAGE, EVENT_UPDATE_PAGE , EVENT_UPDATE_SECTION, TOGGLE_NAV } from '../notebook-constants';
import { throttle } from 'lodash';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        NotebookEntry,
        Search,
        SearchResults,
        Sidebar
    },
    data() {
        return {
            defaultPageId: null,
            defaultSectionId: null,
            defaultSort: this.domainObject.configuration.defaultSort,
            internalDomainObject: this.domainObject,
            search: '',
            showTime: 0,
            showNav: false,
            sidebarCoversEntries: false
        }
    },
    computed: {
        filteredAndSortedEntries() {
            const pageEntries = getNotebookEntries(this.internalDomainObject, this.selectedSection, this.selectedPage) || [];

            return pageEntries.sort(this.sortEntries);
        },
        pages() {
            return this.getPages() || [];
        },
        sections() {
            return this.internalDomainObject.configuration.sections || [];
        },
        selectedPage() {
            const pages = this.getPages();
            if (!pages) {
                return null;
            }

            return pages.find(page => page.isSelected);
        },
        selectedSection() {
            if (!this.sections.length) {
                return null;
            }

            return this.sections.find(section => section.isSelected);
        }
    },
    watch: {
        search(searchTerm) {
            if (!this.$refs.searchResults)  {
                return;
            }

            if (!searchTerm.length) {
                this.$refs.searchResults.$off();

                return;
            }

            this.$refs.searchResults.$on(EVENT_CHANGE_SECTION_PAGE, this.changeSelectedSection.bind(this));
        }
    },
    beforeMount() {
        this.throttledSearchItem = throttle(this.searchItem, 500);
    },
    mounted() {
        this.unlisten = this.openmct.objects.observe(this.internalDomainObject, '*', this.updateInternalDomainObject);
        this.$refs.sidebar.$on(EVENT_UPDATE_SECTION, this.updateSection.bind(this));
        this.$refs.sidebar.$on(EVENT_UPDATE_PAGE, this.updatePage.bind(this));
        this.$refs.sidebar.$on(TOGGLE_NAV, this.toggleNav);
        this.formatSidebar();
        window.addEventListener('orientationchange', this.orientationChange);
    },
    beforeDestroy() {
        if (this.unlisten) {
            this.unlisten();
        }

        if (this.$refs.sidebar) {
            this.$refs.sidebar.$off();
        }
    },
    methods: {
        changeSelectedSection({ sectionId, pageId }) {
            const sections = this.sections.map(s => {
                s.isSelected = false;

                if (s.id === sectionId) {
                    s.isSelected = true;
                }

                s.pages.forEach((p, i) => {
                    p.isSelected = false;

                    if (pageId && pageId === p.id) {
                        p.isSelected = true;
                    }

                    if (!pageId && i === 0) {
                        p.isSelected = true;
                    }
                });

                return s;
            });

            this.search = '';
            this.updateSection({ sections });
        },
        updateDefaultNotebook(selectedSection, selectedPage) {
            setDefaultNotebook(this.internalDomainObject, selectedSection, selectedPage);
        },
        getPage(section, id) {
            return section.pages.find(p => p.id === id);
        },
        getSection(id) {
            return this.sections.find(s => s.id === id);
        },
        getSearchResults() {
            if (!this.search.length) {
                return [];
            }

            const output = [];
            const entries = this.internalDomainObject.configuration.entries;
            const sectionKeys = Object.keys(entries);
            sectionKeys.forEach(sectionKey => {
                const pages = entries[sectionKey];
                const pageKeys = Object.keys(pages);
                pageKeys.forEach(pageKey => {
                    const pageEntries = entries[sectionKey][pageKey];
                    pageEntries.forEach(entry => {
                        if (entry.text && entry.text.toLowerCase().includes(this.search.toLowerCase())) {
                            const section = this.getSection(sectionKey);
                            output.push({
                                section,
                                page: this.getPage(section, pageKey),
                                entry
                            });
                        }
                    });
                });
            });

            return output;
        },
        getPages() {
            const selectedSection = this.getSelectedSection();
            if (!selectedSection || !selectedSection.pages.length) {
                return [];
            }

            return selectedSection.pages;
        },
        getSelectedPage() {
            const pages = this.getPages();
            if (!pages) {
                return null;
            }

            return pages.find(page => page.isSelected);
        },
        getSelectedSection() {
            if (!this.sections.length) {
                return null;
            }

            return this.sections.find(section => section.isSelected);
        },
        mutateObject(key, value) {
            this.openmct.objects.mutate(this.internalDomainObject, key, value);
        },
        newEntry(event) {
            const selectedSection = this.getSelectedSection();
            const selectedPage = this.getSelectedPage();
            this.search = '';

            this.updateDefaultNotebook(selectedSection, selectedPage);
            const notebookStorage = getDefaultNotebook();
            addNotebookEntry(this.openmct, this.internalDomainObject, notebookStorage);
        },
        orientationChange() {
            console.log('changed orientation');
            this.formatSidebar();
        },
        searchItem(input) {
            this.search = input;
        },
        formatSidebar() {
            const self = this;
            setTimeout(() => {
                const MOBILE_PORTRAIT = !!document.querySelector('body.mobile.portrait');
                self.sidebarCoversEntries = MOBILE_PORTRAIT || self.$el.closest('.c-so-view');
                console.log("MOBILE_PORTRAIT", MOBILE_PORTRAIT);
            }, 0);
        },
        sortEntries(right, left) {
            return this.defaultSort === 'newest'
                ? left.createdOn - right.createdOn
                : right.createdOn - left.createdOn;
        },
        toggleNav: function () {
            this.showNav = !this.showNav;
        },
        updateInternalDomainObject(domainObject) {
            this.internalDomainObject = domainObject;
        },
        updatePage({ pages = [], id = null}) {
            const selectedSection = this.getSelectedSection();
            if (!selectedSection) {
                return;
            }

            selectedSection.pages = pages;
            const sections = this.sections.map(section => {
                if (section.id === selectedSection.id) {
                    section = selectedSection;
                }

                return section;
            });

            this.updateSection({ sections });
        },
        updateSection({ sections, id = null }) {
            this.mutateObject('configuration.sections', sections);
        }
    }
}
</script>

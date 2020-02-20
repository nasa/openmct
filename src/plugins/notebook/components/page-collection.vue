<template>
<div>
    <button @click="addPage">+ Add {{ pageTitle }}</button>
    <ul>
        <li v-for="page in pages"
            :key="page.id"
        >
            <Page ref="pageComponent"
                  :page="page"
            />
        </li>
    </ul>
</div>
</template>

<script>
import { EVENT_DELETE_PAGE, EVENT_RENAME_PAGE, EVENT_UPDATE_PAGE, EVENT_SELECT_PAGE } from '../notebook-constants';
import Page from './page-component.vue';
import uuid from 'uuid';

export default {
    inject: ['openmct'],
    components: {
        Page
    },
    props: {
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

            this.removeAllListeners();
            this.addListeners();
        }
    },
    mounted() {
        this.addListeners();
    },
    destroyed() {
        this.removeAllListeners();
    },
    methods: {
        addListeners() {
            setTimeout(() => {
                if (this.$refs.pageComponent) {
                    this.$refs.pageComponent.forEach(element => {
                        element.$on(EVENT_DELETE_PAGE, this.deletePage);
                        element.$on(EVENT_RENAME_PAGE, this.updatePage);
                        element.$on(EVENT_SELECT_PAGE, this.selectPage);
                    });
                }
            },0);
        },
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
            this.$parent.$emit(EVENT_UPDATE_PAGE, { pages });
        },
        deletePage(id) {
            const pages = this.pages.filter(page => page.id !== id);

            if (pages.length) {
                // TODO: select isDefault page
                pages[0].isSelected = true;
            }

            this.$parent.$emit(EVENT_UPDATE_PAGE, { pages });
        },
        removeAllListeners() {
            if (this.$refs.pageComponent) {
                this.$refs.pageComponent.forEach(element => {
                    element.$off();
                });
            }
        },
        selectPage(id) {
            const pages = this.pages.map(page => {
                const isSelected = page.id === id;
                page.isSelected = isSelected;

                return page;
            });

            this.$parent.$emit(EVENT_UPDATE_PAGE, { pages, id });
        },
        updatePage(newPage) {
            const pages = this.pages.map(page =>
                page.id === newPage.id
                    ? newPage
                    : page);
            this.$parent.$emit(EVENT_UPDATE_PAGE, { pages });
        }
    }
}
</script>

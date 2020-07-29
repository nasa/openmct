<template>
<div class="c-preview-header l-browse-bar">
    <div class="l-browse-bar__start">
        <div
            class="l-browse-bar__object-name--w c-object-label"
        >
            <div class="c-object-label__type-icon"
                 :class="type.cssClass"
            ></div>
            <span class="l-browse-bar__object-name c-object-label__name">
                {{ domainObject.name }}
            </span>
        </div>
    </div>
    <div class="l-browse-bar__end">
        <div class="l-browse-bar__actions">
            <view-switcher
                :v-if="!hideViewSwitcher"
                :views="views"
                :current-view="currentView"
                @setView="setView"
            />
        </div>
    </div>
</div>
</template>


<script>
import ContextMenuDropDown from '../../ui/components/contextMenuDropDown.vue';
import NotebookMenuSwitcher from '@/plugins/notebook/components/notebook-menu-switcher.vue';
import ViewSwitcher from '../../ui/layout/ViewSwitcher.vue';

export default {
    inject: [
        'openmct',
        'objectPath'
    ],
    components: {
        ContextMenuDropDown,
        NotebookMenuSwitcher,
        ViewSwitcher
    },
    props: {
        currentView: {
            type: Object,
            default: () => {
                return {};
            }
        },
        domainObject: {
            type: Object,
            default: () => {
                return {};
            }
        },
        hideViewSwitcher: {
            type: Boolean,
            default: () => {
                return false;
            }
        },
        showNotebookMenuSwitcher: {
            type: Boolean,
            default: () => {
                return false;
            }
        },
        views: {
            type: Array,
            default: () => {
                return [];
            }
        }
    },
    data() {
        return {
            type: this.openmct.types.get(this.domainObject.type)
        };
    },
    methods: {
        setView(view) {
            this.$emit('setView', view);
        }
    }
}
</script>

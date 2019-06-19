<template>
<div class="c-elements-pool">
    <Search class="c-elements-pool__search"
        :value="currentSearch"
        @input="applySearch" 
        @clear="applySearch">
    </Search>
    <div class="c-elements-pool__elements"
        :class="{'is-dragging': isDragging}">
        <ul class="c-tree c-elements-pool__tree" id="inspector-elements-tree"
            v-if="elements.length > 0">
            <li :key="element.identifier.key" v-for="(element, index) in elements"
                @drop="moveTo(index)"
                @dragover="allowDrop">
                <div class="c-tree__item c-elements-pool__item"
                     draggable="true"
                     @dragstart="moveFrom(index)">
                    <span class="c-elements-pool__grippy"
                          v-if="elements.length > 1 && isEditing">
                    </span>
                    <object-label :domainObject="element" :objectPath="[element, parentObject]"></object-label>
                </div>
            </li>
            <li class="js-last-place" @drop="moveToIndex(elements.length)"></li>
        </ul>
        <div v-if="elements.length === 0">No contained elements</div>
    </div>
</div>
</template>
<style lang="scss">
    @import "~styles/sass-base";

    .c-elements-pool {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex: 1 1 auto !important;

        > * + * {
            margin-top: $interiorMargin;
        }

        &__search {
            flex: 0 0 auto;
        }

        &__elements {
            flex: 1 1 auto;
            overflow: auto;
            &.is-dragging {
                li { opacity: 0.2; }
            }
        }

        &__grippy {
            $d: 8px;
            @include grippy($c: $colorItemTreeVC, $dir: 'y');
            flex: 0 0 auto;
            margin-right: $interiorMarginSm;
            transform: translateY(-2px);
            width: $d; height: $d;
        }
    }

    .js-last-place {
        height: 10px;
    }
</style>
<script>
import _ from 'lodash';
import Search from '../components/search.vue';
import ObjectLabel from '../components/ObjectLabel.vue';

export default {
    inject: ['openmct'],
    components: {
        'Search': Search,
        'ObjectLabel': ObjectLabel
    },
    data() {
        return {
            elements: [],
            isEditing: this.openmct.editor.isEditing(),
            parentObject: undefined,
            currentSearch: '',
            isDragging: false,
            selection: []
        }
    },
    mounted() {
        let selection = this.openmct.selection.get();
        if (selection && selection.length > 0){
            this.showSelection(selection);
        }
        this.openmct.selection.on('change', this.showSelection);
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    methods: {
        setEditState(isEditing) {
            this.isEditing = isEditing;
            this.showSelection(this.openmct.selection.get());
        },
        showSelection(selection) {
            if (_.isEqual(this.selection, selection)) {
                return;
            }
            this.selection = selection;
            this.elements = [];
            this.elementsCache = {};
            this.listeners = [];
            this.parentObject = selection && selection[0] && selection[0][0].context.item;

            if (this.mutationUnobserver) {
                this.mutationUnobserver();
            }
            if (this.compositionUnlistener) {
                this.compositionUnlistener();
            }

            if (this.parentObject) {
                this.composition = this.openmct.composition.get(this.parentObject);

                if (this.composition) {
                    this.composition.load();

                    this.composition.on('add', this.addElement);
                    this.composition.on('remove', this.removeElement);
                    this.composition.on('reorder', this.reorderElements);

                    this.compositionUnlistener = () => {
                        this.composition.off('add', this.addElement);
                        this.composition.off('remove', this.removeElement);
                        this.composition.off('reorder', this.reorderElements);
                        delete this.compositionUnlistener;
                    }
                }
            }
        },
        addElement(element) {
            let keyString = this.openmct.objects.makeKeyString(element.identifier);
            this.elementsCache[keyString] = element;
            this.applySearch(this.currentSearch);
        },
        reorderElements() {
            this.applySearch(this.currentSearch);
        },
        removeElement(identifier) {
            let keyString = this.openmct.objects.makeKeyString(identifier);
            delete this.elementsCache[keyString];
            this.applySearch(this.currentSearch);
        },
        applySearch(input) {
            this.currentSearch = input;
            this.elements = this.parentObject.composition.map((id) =>
                this.elementsCache[this.openmct.objects.makeKeyString(id)]
            ).filter((element) => {
                return element !== undefined &&
                    element.name.toLowerCase().search(this.currentSearch) !== -1;
            });
        },
        allowDrop(event) {
            event.preventDefault();
        },
        moveTo(moveToIndex) {
            this.composition.reorder(this.moveFromIndex, moveToIndex);
        },
        moveFrom(index){
            this.isDragging = true;
            this.moveFromIndex = index;
            document.addEventListener('dragend', this.hideDragStyling);
        },
        hideDragStyling() {
            this.isDragging = false;
            document.removeEventListener('dragend', this.hideDragStyling);
        }
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.setEditState);
        this.openmct.selection.off('change', this.showSelection);

        if (this.compositionUnlistener) {
            this.compositionUnlistener();
        }
    }
}
</script>

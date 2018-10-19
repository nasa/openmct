<template>
<div class="flex-elem l-flex-col holder grows">
    <Search @input="applySearch"></Search>
    <div class="flex-elem grows vscroll scroll-pad">
        <ul class="tree" id="inspector-elements-tree"
            v-if="elements.length > 0">
            <li :key="element.identifier.key" v-for="(element, index) in elements" @drop="moveTo(index)" @dragover="allowDrop">
                <span class="tree-item">
                    <span class="grippy-sm"
                          v-if="elements.length > 1 && isEditing"
                          draggable="true"
                          @dragstart="moveFrom(index)">
                    </span>
                    <object-label :domainObject="element"></object-label>
                </span>
            </li>
            <li class="js-last-place" @drop="moveToIndex(elements.length)"></li>
        </ul>
        <div v-if="elements.length === 0">No contained elements</div>    
    </div>
</div>
</template>
<style lang="scss">
    @import "~styles/sass-base";
    @import "~styles/glyphs";

    .grippy-sm {
        // Used in editor Elements pool
        @extend .icon-grippy-12px;
        cursor: move;
    }

    .js-last-place{
        height: 10px;
    }
</style>
<script>
import Search from '../controls/search.vue';
import ObjectLabel from '../controls/ObjectLabel.vue';

export default {
    inject: ['openmct'],
    components: {
        'Search': Search,
        'ObjectLabel': ObjectLabel
    },
    data() {
        return {
            elements: [],
            isEditing: this.openmct.editor.isEditing()
        }
    },
    mounted() {
        let selection = this.openmct.selection.get();
        if (selection && selection.length > 0){
            this.showSelection(selection);
        }
        this.openmct.selection.on('change', this.showSelection);
        this.openmct.editor.on('isEditing', (isEditing)=>{
            this.isEditing = isEditing;
            this.showSelection(this.openmct.selection.get());
        });
    },
    methods: {
        showSelection(selection) {
            this.elements = [];
            this.elementsCache = [];
            this.parentObject = selection[0].context.item;
            if (this.mutationUnobserver) {
                this.mutationUnobserver();
            }
            this.mutationUnobserver = this.openmct.objects.observe(this.parentObject, '*', (updatedModel) => {
                this.parentObject = updatedModel;
                this.refreshComposition();
            });
            this.refreshComposition();
        },
        refreshComposition() {
            let composition = this.openmct.composition.get(this.parentObject);

            if (composition){
                composition.load().then(this.setElements);
            }

        },
        setElements(elements) {
            this.elementsCache = elements.map((element)=>JSON.parse(JSON.stringify(element)))
            this.applySearch(this.currentSearch);
        },
        applySearch(input) {
            this.currentSearch = input;
            this.elements = this.elementsCache.filter((element) => {
                return element.name.toLowerCase().search(
                    this.currentSearch) !== -1;
            });
        },
        addObject(child){
            this.elementsCache.push(child);
            this.applySearch(this.currentSearch);
        },
        removeObject(childId){
            this.elementsCache = this.elementsCache.filter((element) => !matches(element, childId));
            this.applySearch(this.currentSearch);

            function matches(elementA, elementBId) {
                return elementA.identifier.namespace === elementBId.namespace &&
                    elementA.identifier.key === elementBId.key;
            }

        },
        allowDrop(event) {
            event.preventDefault();
        },
        moveTo(moveToIndex) {
            console.log('dropped');
            let composition = this.parentObject.composition;
            let moveFromId = composition[this.moveFromIndex];
            let deleteIndex = this.moveFromIndex;
            if (moveToIndex < this.moveFromIndex) {
                composition.splice(deleteIndex, 1);
                composition.splice(moveToIndex, 0, moveFromId);
            } else {
                composition.splice(deleteIndex, 1);
                composition.splice(moveToIndex, 0, moveFromId);
            }
            
            this.openmct.objects.mutate(this.parentObject, 'composition', composition);
        },
        moveFrom(index){
            this.moveFromIndex = index;
        }
    },
    destroyed() {
    }
}
</script>

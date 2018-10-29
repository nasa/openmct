<template>
    <div class="flexible-layout-container">
        <div class="header" 
             v-if="isEditing"
             @click="addColumn">
            Add a new column
        </div>

        <div class="body">
            <column-component
                 v-for="(column, index) in columns"
                 :key="index"
                 :index="index"
                 :minWidth="column.width || `${100/columns.length}%`"
                 :rows="column.rows"
                 :isEditing="isEditing"
                 @addRow="addRow"
                 @object-drag-from="dragFromHandler"
                 @object-drop-to="dropToHandler">
            </column-component>
        </div> 
    </div>
</template>

<style lang="scss">
    @import '~styles/sass-base.scss';

    .flexible-layout-container {
        display: flex;
        flex-direction: column;
        .header {
            font-size: 22px;
            text-align: center; 
            min-height: 30px;
            min-width: 100%;
            background: rgb(66, 96, 96);

            &:hover{
                cursor: pointer;
            }
        }

        .body {
            min-width: 100%;
            min-height: 85vh;
            max-height: 85vh;
            display: flex;
            flex-direction: row;
        }
    }
</style>

<script>
import ColumnComponent  from '../components/column.vue';
import Column from '../utils/column';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        columnComponent: ColumnComponent
    },
    data() {
        let columns = this.domainObject.configuration.columns;

        return {
            columns: columns,
            dragFrom: [],
            isEditing: false
        }
    },
    methods: {
        addColumn() {
            let column = new Column()

            this.columns.push(column);
        },
        addRow(row, index) {
            this.columns[index].addRow(row);
        },
        dragFromHandler(columnIndex, rowIndex) {
            this.dragFrom = [columnIndex, rowIndex];
        },
        dropToHandler(columnIndex, rowIndex, rowObject) {
            if (!rowObject) {
                rowObject = this.columns[this.dragFrom[0]].rows.splice(this.dragFrom[1], 1)[0];
            }

            this.columns[columnIndex].rows.splice((rowIndex + 1), 0, rowObject);

            this.persist();
        },
        persist(){
            this.openmct.objects.mutate(this.domainObject, '.configuration.columns', this.columns);
        },
        isEditingHandler(isEditing) {
            this.isEditing = isEditing;
        }
    },
    mounted() {
        console.log(this.openmct.editor);
        this.openmct.editor.on('isEditing', this.isEditingHandler);
    }
}
</script>

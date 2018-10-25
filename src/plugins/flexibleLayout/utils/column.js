class Column {
    constructor (width) {
        this.rows = [];
        this.width = width;
    }

    addRow(rowObject) {
        this.rows.push(rowObject);
    }
}

export default Column;

import Row from './row';

class Column {
    constructor (width) {
        this.rows = [new Row({}, '5%')];
        this.width = width;
    }

    addRow(rowObject) {
        this.rows.push(rowObject);
    }
}

export default Column;

import etch from 'etch';

import LADTableItem from 'es6!./lad-table-item';

class LADTable {
    constructor (properties, children) {
        this.props = properties;
        this.props.headers = this.props.headers || [
            'Name',
            'Timestamp',
            'Value'
        ];
        this.props.children = this.props.children || [];
        this.composition = this.props
            .openmct
            .composition
            .get(this.props.domainObject);
        this.composition.on('add', this.addChild, this);
        this.composition.on('remove', this.removeChild, this);
        etch.initialize(this);
        this.composition.load();
    }
    render () {
        return etch.dom('table', {},
            etch.dom('thead', null,
                etch.dom('tr', null,
                     this.props.headers.map((h) => etch.dom('th', null, h))
                )
            ),
            etch.dom('tbody', null,
                this.props.children.map((c) => etch.dom(LADTableItem, {
                    domainObject: c,
                    key: c.identifier,
                    headers: this.props.headers,
                    openmct: this.props.openmct
                }))
            )
        );
    }
    destroy () {
        this.composition.off('add', this.addChild, this);
        this.composition.off('remove', this.removeChild, this);
        delete this.composition;
        etch.destroy(this);
    }
    addChild (child) {
        this.props.children.push(child);
        etch.update(this);
    }
    removeChild (cid) {
        this.props.children = this.props.children.filter(function (c) {
            return !(c.identifier.key === cid.key && c.identifier.namespace === cid.namespace)
        });
        etch.update(this);
    }
    update (props, children) {
        this.domainObject = properties.domainObject;
        this.children = properties.children || [];
        return etch.update(this)
    }
}

export default LADTable

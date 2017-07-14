define([
    './LADTableItem',
    'etch'
], function (
    LADTableItem,
    etch
) {

    function LADTable(properties, children) {
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


    LADTable.prototype.render = function () {
        return etch.dom('table', {},
            etch.dom('thead', null,
                etch.dom('tr', null, this.props.headers.map(function (h) {
                    return etch.dom('th', null, h);
                }, this))
            ),
            etch.dom('tbody', null, this.props.children.map(function (c) {
                return etch.dom(LADTableItem, {
                    domainObject: c,
                    key: c.identifier,
                    headers: this.props.headers,
                    openmct: this.props.openmct
                });
            }, this))
        );
    };

    LADTable.prototype.destroy = function () {
        this.composition.off('add', this.addChild, this);
        this.composition.off('remove', this.removeChild, this);
        delete this.composition;
        etch.destroy(this);
    };

    LADTable.prototype.addChild = function (child) {
        this.props.children.push(child);
        etch.update(this);
    };

    LADTable.prototype.removeChild = function (cid) {
        this.props.children = this.props.children.filter(function (c) {
            return !(c.identifier.key === cid.key &&
                     c.identifier.namespace === cid.namespace);
        });
        etch.update(this);
    };

    LADTable.prototype.update = function (props, children) {
        this.domainObject = properties.domainObject;
        this.children = properties.children || [];
        return etch.update(this);
    };

    return LADTable;
});



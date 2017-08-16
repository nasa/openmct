define([
    'text!../res/ruleImageTemplate.html',
    'zepto'
], function (
    ruleImageTemplate,
    $
) {

    //and a drag area where the drag and drop should apply
    function WidgetDnD(container, ruleOrder, rulesById) {
        this.ruleOrder = ruleOrder;
        this.rulesById = rulesById;

        this.imageContainer = $(ruleImageTemplate);
        this.image = $('.t-drag-rule-image', this.imageContainer);
        this.draggingId = '';
        this.draggingRulePrevious = '';

        this.callbacks = {
            drop: []
        };

        this.drag = this.drag.bind(this);
        this.drop = this.drop.bind(this);

        $(container).on('mousemove', this.drag);
        $(document).on('mouseup', this.drop);
        $(container).before(this.imageContainer);
        $(this.imageContainer).hide();
    }

    WidgetDnD.prototype.on = function (event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    };

    WidgetDnD.prototype.setDragImage = function (image) {
        this.image.html(image);
    };

    WidgetDnD.prototype.getDropLocation = function (event) {
        var ruleOrder = this.ruleOrder,
            rulesById = this.rulesById,
            draggingId = this.draggingId,
            offset,
            y,
            height,
            dropY = event.pageY,
            target = '';

        ruleOrder.forEach(function (ruleId, index) {
            offset = rulesById[ruleId].getDOM().offset();
            y = offset.top;
            height = offset.height;
            if (index === 0) {
                if (dropY < y + 7 * height / 3) {
                    target = ruleId;
                }
            } else if (index === ruleOrder.length - 1 && ruleId !== draggingId) {
                if (y + height / 3 < dropY) {
                    target = ruleId;
                }
            } else {
                if (y + height / 3 < dropY && dropY < y + 7 * height / 3) {
                    target = ruleId;
                }
            }
        });
        return target;
    };

    WidgetDnD.prototype.dragStart = function (ruleId) {
        var ruleOrder = this.ruleOrder;
        this.draggingId = ruleId;
        this.draggingRulePrevious = ruleOrder[ruleOrder.indexOf(ruleId) - 1];
        this.rulesById[this.draggingRulePrevious].showDragIndicator();
        this.imageContainer.show();
        this.imageContainer.offset({
            top: event.pageY - this.image.height() / 2,
            left: event.pageX - $('.t-grippy', this.image).width()
        });
    };

    WidgetDnD.prototype.drag = function (event) {
        var dragTarget;
        if (this.draggingId && this.draggingId !== '') {
            event.preventDefault();
            dragTarget = this.getDropLocation(event);
            this.imageContainer.offset({
                top: event.pageY - this.image.height() / 2,
                left: event.pageX - $('.t-grippy', this.image).width()
            });
            if (this.rulesById[dragTarget]) {
                this.rulesById[dragTarget].showDragIndicator();
            } else {
                this.rulesById[this.draggingRulePrevious].showDragIndicator();
            }
        }
    };

    WidgetDnD.prototype.drop = function (event) {
        var dropTarget = this.getDropLocation(event),
            draggingId = this.draggingId;

        if (this.draggingId && this.draggingId !== '') {
            if (!this.rulesById[dropTarget]) {
                dropTarget = this.draggingId;
            }
            this.callbacks.drop.forEach(function (callback) {
                if (callback) {
                    callback(draggingId, dropTarget);
                }
            });
            this.draggingId = '';
            this.draggingRulePrevious = '';
            this.imageContainer.hide();
        }
    };

    return WidgetDnD;
});

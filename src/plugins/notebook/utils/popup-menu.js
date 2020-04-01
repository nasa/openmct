import $ from 'zepto';

export const togglePopupMenu = (event, openmct) => {
    event.preventDefault();

    const body = $(document.body);
    const container = $(event.target.parentElement.parentElement);
    const classList = document.querySelector('body').classList;
    const isPhone = Array.from(classList).includes('phone');
    const isTablet = Array.from(classList).includes('tablet');

    const initiatingEvent = isPhone || isTablet
        ? 'touchstart'
        : 'mousedown';
    const menu = container.find('.menu-element');
    let dismissExistingMenu;

    function dismiss() {
        container.find('.hide-menu').append(menu);
        body.off(initiatingEvent, menuClickHandler);
        dismissExistingMenu = undefined;
    }

    function menuClickHandler(e) {
        window.setTimeout(() => {
            dismiss();
        }, 100);
    }

    // Dismiss any menu which was already showing
    if (dismissExistingMenu) {
        dismissExistingMenu();
    }

    // ...and record the presence of this menu.
    dismissExistingMenu = dismiss;

    const popupService = openmct.$injector.get('popupService');
    popupService.display(menu, [event.pageX,event.pageY], {
        marginX: 0,
        marginY: -50
    });

    body.on(initiatingEvent, menuClickHandler);
}

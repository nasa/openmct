export const getStyleProp = (key, defaultValue) => {
    let styleProp = undefined;
    switch(key) {
    case 'fill': styleProp = {
        backgroundColor: defaultValue || 'transparent'
    };
        break;
    case 'stroke': styleProp = {
        border: '1px solid ' + (defaultValue || 'transparent')
    };
        break;
    case 'color': styleProp = {
        color: defaultValue || 'transparent'
    };
        break;
    case 'url': styleProp = {
        imageUrl: defaultValue || 'transparent'
    };
        break;
    }

    return styleProp;
};

export const getStyleProp = (key, defaultValue) => {
    let styleProp = undefined;
    switch(key) {
    case 'fill': styleProp = {
        backgroundColor: defaultValue || 'none'
    };
        break;
    case 'stroke': styleProp = {
        border: '1px solid ' + defaultValue || 'none'
    };
        break;
    case 'color': styleProp = {
        color: defaultValue || 'inherit'
    };
        break;
    }

    return styleProp;
};

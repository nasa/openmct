export const TRIGGER = {
    ANY: 'any',
    ALL: 'all'
};

export const getStyleProp = (key, defaultValue) => {
    let styleProp = undefined;
    switch(key) {
    case 'fill': styleProp = {
        backgroundColor: defaultValue || 'none'
    };
        break;
    case 'stroke': styleProp = {
        borderColor: defaultValue || 'none'
    };
        break;
    case 'color': styleProp = {
        color: defaultValue || 'inherit'
    };
        break;
    }

    return styleProp;
};

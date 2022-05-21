define({
    convertTemplateToHTML: function (templateString) {
        const template = document.createElement('template');
        template.innerHTML = templateString;

        return template.content;
    },
    toggleClass: function (element, className) {
        if (element.classList.contains(className)) {
            element.classList.remove(className);
        } else {
            element.classList.add(className);
        }
    }
});

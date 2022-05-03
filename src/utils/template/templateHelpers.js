define({
    convertTemplateToHTML: function (templateString) {
        const template = document.createElement('template');
        template.innerHTML = templateString;

        return template.content;
    }
});

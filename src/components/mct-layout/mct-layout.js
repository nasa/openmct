define([
    'text!./mct-layout.html',
    'vue'
], function (
    layoutTemplate,
    Vue
) {


    function MCTLayout($injector, angular) {
        var $injector = $injector;
        var $rootScope = $injector.get('$rootScope');
        var $compile = $injector.get('$compile');
        var templateMap = {};
        $injector.get('templates[]').forEach(function (t) {
            templateMap[t.key] = templateMap[t.key] || t;
        });
        var templateLinker = $injector.get('templateLinker');
        // Vue.component('mct-include', {
        //     props: ['mctKey', 'key'],
        //     render: function (createElement) {
        //         window.includeComp = this;
        //         console.log('mct-include is rendering!', this, this.$el);
        //         this.scope = $rootScope.$new();
        //         this.ngEl = angular.element(this.$el);
        //         templateLinker.link(this.scope, this.ngEl, templateMap[this.mctKey]);
        //         return this.ngEl;
        //     },
        //     template: "<div></div>",
        //     mounted: function () {
        //         console.log('done rendering!');
        //     }
        // });
        Vue.component('mct-include', {
            props: ['mctKey', 'key'],
            // render: function (createElement) {
            // },
            template: "<div></div>",
            mounted: function () {
                // debugger;
                window.includeComp = this;
                // console.log('mct-include is rendering!', this, this.$el);
                this.scope = $rootScope.$new();
                this.ngEl = angular.element(this.$el);
                templateLinker.link(this.scope, this.ngEl, templateMap[this.mctKey]);
                // return this.ngEl;
                // console.log('done rendering!');
            }
        });

        Vue.component('mct-directive', {
            props: ['mct-key'],
            template: "</div></div>",
            mounted: function () {
                var template = `<${this.mctKey} ` +
                    Object.keys(this.$attrs).map((k) => `${k}="${this.$attrs[k]}"`).join(' ') +
                    ' ></${this.mctKey}>';
                this.scope = $rootScope.$new();
                this.ngEl = $compile(template)(this.scope);
                this.$el.appendChild(this.ngEl[0]);
            }
        })


        // Vue.component('mct-directive', )

        Vue.component('mct-representation', {
            template: "<div></div>",
            mounted: function () {
                var template = "<mct-representation " +
                    Object.keys(this.$attrs).map((k) => `${k}="${this.$attrs[k]}"`).join(' ') +
                    ' ></mct-representation>';
                this.scope = $rootScope.$new();
                this.ngEl = $compile(template)(this.scope);
                // console.log('mct-representation mounting', this);
            }
        });

        Vue.component('mct-layout', {
            template: layoutTemplate,
        });

        this.view = new Vue({
            el: "#openmct",
            template: '<mct-layout></mct-layout>'
        });
    }

    MCTLayout.prototype.initComponents = function (ngInternal) {
        var $injector = ngInternal.injector;
        var $rootScope = injector.get('$rootScope');
        var $compile = injector.get('$compile');
    }

    return MCTLayout;
});

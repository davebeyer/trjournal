/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/firebase/firebase.d.ts" />
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var angular2_1 = require('angular2/angular2');
var Dropdown = (function () {
    function Dropdown() {
        // Only initialize locally instatiated data here 
        // (angular2-dependent data has not yet been fully initialized)
        this.initevent = new angular2_1.EventEmitter();
        this.current = "-1";
    }
    Dropdown.prototype.onInit = function () {
        // onInit() is a angular2 lifecycle method called 
        // automatically after angular2 has completed initialization
        console.log("Dropdown options", this.options);
        this.initevent.next(this); // send initevent to parent component
    };
    Dropdown.prototype.handleSelect = function ($event) {
        this.current = $event.target.value;
        console.log("Dropdown selected", this.current);
    };
    Dropdown.prototype.currentValue = function () {
        if (this.current === "-1") {
            return "";
        }
        else {
            return this.current;
        }
    };
    Dropdown = __decorate([
        angular2_1.Component({
            selector: 'dropdown',
            properties: ['options', 'id', 'name'],
            events: ['initevent'] // NOTE that event names must be all lower case
        }),
        angular2_1.View({
            template: "\n        <select class=\"form-control\"  (change)=\"handleSelect($event)\" id=\"{{id}}\">\n          <option value=\"-1\">Select {{name}}</option>\n          <option *ng-for=\"#opt of options\" value=\"{{opt}}\">{{opt}}</option>\n        </select>\n        ",
            directives: [angular2_1.NgFor]
        }), 
        __metadata('design:paramtypes', [])
    ], Dropdown);
    return Dropdown;
})();
exports.Dropdown = Dropdown;
//# sourceMappingURL=dropdown.js.map
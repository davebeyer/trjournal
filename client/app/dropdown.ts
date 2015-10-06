/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/firebase/firebase.d.ts" />

import {Component, View, NgFor, EventEmitter} from 'angular2/angular2';

@Component({
    selector:   'dropdown',
    properties: ['options', 'id', 'name'],
    events:     ['initevent']     // NOTE that event names must be all lower case
})

@View({
    template: `
        <select class="form-control"  (change)="handleSelect($event)" id="{{id}}">
          <option value="-1">Select {{name}}</option>
          <option *ng-for="#opt of options" value="{{opt}}">{{opt}}</option>
        </select>
        `,
    directives: [NgFor]
})


export class Dropdown {
    // Properties
    options : Array<string>;  // list of strings for the <options> list
    id      : string;         // id for the <select> element
    name    : string;         // name of this dropdown

    // Locals
    current : string;         // current value

    //
    // Currently a 2-step initialization to hook-up child to parent components
    // (registerParent() step not needed for this component)
    //
    //   constructor() - [name fixed by JS/Typescript] local (non-angular2-dependent) data only 
    //
    //   onInit()      - [name fixed by angular2] angular2 lifecycle init-done event callback 
    //                   Generate a initevent [DB convention name] to alert parent of new child component.
    //                   (Parent component will then typically have a register<ChildComponentType>() event handler)
    //
    // TODO: Easier method to get pointers to parent & children components 
    //       (and/or their needed data)
    //

    // initevent emitter
    parent        : any;  
    initevent     : EventEmitter;

    constructor() {
        // Only initialize locally instatiated data here 
        // (angular2-dependent data has not yet been fully initialized)
        this.initevent = new EventEmitter();
        this.current = "-1";
    }

    onInit() {
        // onInit() is a angular2 lifecycle method called 
        // automatically after angular2 has completed initialization

        console.log("Dropdown options", this.options);

        this.initevent.next(this); // send initevent to parent component
    }

    handleSelect($event) {
        this.current = $event.target.value;
        console.log("Dropdown selected", this.current);
    }

    currentValue() {
        if (this.current === "-1") {
            return "";
        } else {
            return this.current;
        }
    }
}

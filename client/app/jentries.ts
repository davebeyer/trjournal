/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/firebase/firebase.d.ts" />
/// <reference path="../../typings/requirejs/require.d.ts" />

import {Component, View, NgFor, NgIf, EventEmitter} from 'angular2/angular2';

var formatDate = require('../assets/js/utils').formatDate;

@Component({
    selector:   'journal-entries',
    properties: ['journalIdStr : journal-id-str'],  // renaming to camel case
    events:     ['initevent']     // NOTE that event names must be all lower case
})

@View({
    template: `
        <table style="width:100%">
          <tr>
            <td style="width:100px"> {{todayDate}} </td>
            <td> 
              <input type="text" class="form-control input-sm" #entryinput
                     value="{{todayNote}}" (change)="updateTodayNote(entryinput.value)">
            </td>
          </tr>

          <tr *ng-for="#entry of otherEntries">
            <td style="width:100px"> {{entry.noteDate}} </td>
            <td> {{entry.note}} </td>
          </tr>
        </table>
        `,
    directives: [NgFor, NgIf]
})


export class JournalEntries {
    journalIdStr    : string;

    otherEntries    : Array<any>;

    todayDate       : string;
    todayNote       : string;

    //
    // Currently a 3-step initialization to hook-up child to parent components
    //
    //   constructor() - [name fixed by JS/Typescript] local (non-angular2-dependent) data only 
    //
    //   onInit()      - [name fixed by angular2] angular2 lifecycle init-done event callback 
    //                   Generate a initevent [DB convention name] to alert parent of new child component.
    //                   (Parent component will then typically have a register<ChildComponentType>() event handler)
    //
    //   registerParent() - [DB convention name] called by parent component
    //
    // TODO: Easier method to get pointers to parent & children components 
    //       (and/or their needed data)
    //

    // initevent emitter
    parent        : any;  
    dbJournalRef  : Firebase;      // ToDo: use dependency injector to get Database service
    initevent     : EventEmitter;

    constructor() {
        this.otherEntries  = [];
        this.todayDate     = formatDate();
        this.todayNote     = '';

        // Only initialize locally instatiated data here 
        // (angular2-dependent data has not yet been fully initialized)

        this.initevent = new EventEmitter();

        this.parent       = null;
        this.dbJournalRef = null;
    }

    onInit() {
        // onInit() is a angular2 lifecycle method called 
        // automatically after angular2 has completed initialization

        console.log("onInit: for JournalEntries", this.journalIdStr);
        this.initevent.next(this); // send initevent to parent component
    }

    registerParent(parent, fbRef) {
        console.log("registerParent: for JournalEntries", parent, this.journalIdStr);
        this.parent = parent;

        //
        // Complete initialization, now that everything is ready
        //

        var dbUserId      = this.parent.parent.dbUserId();
	this.dbJournalRef = fbRef.child(dbUserId).child('entries').child(this.journalIdStr);

        var self = this;

	var journalRef = 

        this.dbJournalRef.on('child_added', function(snapshot, prevChildKey) {
            var entryData = {note : snapshot.val(), noteDate : snapshot.key()};
            console.log("registering new journal entry", entryData);

            self.handleEntryDisplay(entryData);
        });

        // Watch for (remote) changes on todayNote
        this.dbJournalRef.on("child_changed", function(snapshot, prevChildKey) {
            if (snapshot.key() != self.todayDate) {
                // ignore, at least for now
                return; 
            }
            if (self.todayNote != snapshot.val()) {
                self.todayNote = snapshot.val();
                console.log("Remote update of today's note to", self.todayNote);
            }
        });
    }

    handleEntryDisplay(entryData) {
        if (entryData.noteDate == this.todayDate) {
            this.todayNote = entryData.note;
        } else {
            // Insert into list according to noteDate descending
            var i = 0;
            while (i < this.otherEntries.length && entryData.noteDate < this.otherEntries[i].noteDate) {
                i += 1;
            }

            // Insert into list
            this.otherEntries.splice(i, 0, entryData);
        }
    }

    updateTodayNote(value) {
        console.log("Updating today's note to:", value);

        var updateObj = {};
        updateObj[this.todayDate] =  value;

        var self = this;

        this.dbJournalRef.update(updateObj, function() {
            self.parent.parent.flashSaved();
        });
    }
}

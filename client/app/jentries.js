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
var formatDate = require('assets/js/utils.js').formatDate;
var JournalEntries = (function () {
    function JournalEntries() {
        this.otherEntries = [];
        this.todayDate = formatDate();
        this.todayNote = '';
        // Only initialize locally instatiated data here 
        // (angular2-dependent data has not yet been fully initialized)
        this.initevent = new angular2_1.EventEmitter();
        this.parent = null;
        this.dbJournalRef = null;
    }
    JournalEntries.prototype.onInit = function () {
        // onInit() is a angular2 lifecycle method called 
        // automatically after angular2 has completed initialization
        console.log("onInit: for JournalEntries", this.journalIdStr);
        this.initevent.next(this); // send initevent to parent component
    };
    JournalEntries.prototype.registerParent = function (parent, fbRef) {
        console.log("registerParent: for JournalEntries", parent, this.journalIdStr);
        this.parent = parent;
        //
        // Complete initialization, now that everything is ready
        //
        var dbUserId = this.parent.parent.dbUserId();
        this.dbJournalRef = fbRef.child(dbUserId).child('entries').child(this.journalIdStr);
        var self = this;
        var journalRef = this.dbJournalRef.on('child_added', function (snapshot, prevChildKey) {
            var entryData = { note: snapshot.val(), noteDate: snapshot.key() };
            console.log("registering new journal entry", entryData);
            self.handleEntryDisplay(entryData);
        });
        // Watch for (remote) changes on todayNote
        this.dbJournalRef.on("child_changed", function (snapshot, prevChildKey) {
            if (snapshot.key() != self.todayDate) {
                // ignore, at least for now
                return;
            }
            if (self.todayNote != snapshot.val()) {
                self.todayNote = snapshot.val();
                console.log("Remote update of today's note to", self.todayNote);
            }
        });
    };
    JournalEntries.prototype.handleEntryDisplay = function (entryData) {
        if (entryData.noteDate == this.todayDate) {
            this.todayNote = entryData.note;
        }
        else {
            // Insert into list according to noteDate descending
            var i = 0;
            while (i < this.otherEntries.length && entryData.noteDate < this.otherEntries[i].noteDate) {
                i += 1;
            }
            // Insert into list
            this.otherEntries.splice(i, 0, entryData);
        }
    };
    JournalEntries.prototype.updateTodayNote = function (value) {
        console.log("Updating today's note to:", value);
        var updateObj = {};
        updateObj[this.todayDate] = value;
        var self = this;
        this.dbJournalRef.update(updateObj, function () {
            self.parent.parent.flashSaved();
        });
    };
    JournalEntries = __decorate([
        angular2_1.Component({
            selector: 'journal-entries',
            properties: ['journalIdStr : journal-id-str'],
            events: ['initevent'] // NOTE that event names must be all lower case
        }),
        angular2_1.View({
            template: "\n        <table style=\"width:100%\">\n          <tr>\n            <td style=\"width:100px\"> {{todayDate}} </td>\n            <td> \n              <input type=\"text\" class=\"form-control input-sm\" #entryinput\n                     value=\"{{todayNote}}\" (change)=\"updateTodayNote(entryinput.value)\">\n            </td>\n          </tr>\n\n          <tr *ng-for=\"#entry of otherEntries\">\n            <td style=\"width:100px\"> {{entry.noteDate}} </td>\n            <td> {{entry.note}} </td>\n          </tr>\n        </table>\n        ",
            directives: [angular2_1.NgFor, angular2_1.NgIf]
        }), 
        __metadata('design:paramtypes', [])
    ], JournalEntries);
    return JournalEntries;
})();
exports.JournalEntries = JournalEntries;
//# sourceMappingURL=jentries.js.map
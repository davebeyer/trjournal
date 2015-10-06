/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/firebase/firebase.d.ts" />
/// <reference path="./tradesview.ts" />
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
var OpenTrades = require('./tradesview.js').OpenTrades;
var Firebase = require('assets/node_modules/firebase/lib/firebase-web.js');
var TradeJournal = (function () {
    function TradeJournal() {
        console.log("main.ts: in TradeJournal constructor");
        this.fbRef = new Firebase('https://trjournal.firebaseio.com');
        this.openTrades = null;
    }
    // Called via 'initevent' event from OpenTrades component
    TradeJournal.prototype.registerOpenTrades = function (openTradesComp) {
        var self = this;
        self.openTrades = openTradesComp;
        self.prepareDB(function () {
            // Register parent (and other initialization) after DB is ready
            self.openTrades.registerParent(self, self.fbRef);
        });
    };
    // Current user, fixed to Ed for now
    TradeJournal.prototype.userId = function () {
        return "eactracker@gmail.com";
    };
    TradeJournal.prototype.dbUserId = function () {
        // Assume userId is an email address and replace with valid ID chars
        var res = this.userId().replace('@', '-at-').replace('.', '_');
        res = this.validIdChars(res);
        res = res.toLowerCase();
        return res;
    };
    TradeJournal.prototype.prepareDB = function (doneCB) {
        var self = this;
        self.fbRef.once('value', function (data) {
            if (data.child('vocabs').exists()) {
                self.prepareDBForUser(doneCB);
            }
            else {
                var dbSetup = {
                    vocabs: {
                        accounts: {
                            Schwab: 'Schwab',
                            TD: 'TD Ameritrade'
                        },
                        strategies: {
                            MM: 'what MM stands for',
                            CC: 'what CC stands for',
                            'CC-a': 'what CC-a stands for'
                        }
                    }
                };
                self.fbRef.update(dbSetup, function () {
                    self.prepareDBForUser(doneCB);
                });
            }
        });
    };
    TradeJournal.prototype.prepareDBForUser = function (doneCB) {
        var self = this;
        var userIdStr = self.dbUserId();
        self.fbRef.once('value', function (data) {
            if (data.child(userIdStr).exists()) {
                doneCB();
            }
            else {
                var userSetup = {};
                userSetup[userIdStr] = {
                    trades: {
                        'dummy_dummy_dummy': {
                            strategy: 'dummy',
                            expiration: 'dummy',
                            account: 'dummy',
                            openDate: '1900-01-01',
                            status: 'dummy'
                        }
                    },
                    entries: {
                        'dummy_dummy_dummy': {
                            '1900-01-01': 'dummy'
                        },
                    },
                };
                // use set rather than update to init DB
                self.fbRef.update(userSetup, function () {
                    doneCB();
                });
            }
        });
    };
    //
    // Valid ID string helper methods
    //
    // Only allow letters, numbers, underscore and dash characters, so it can 
    // be used for HTML ids, jquery, and Firebase keys
    //
    TradeJournal.prototype.invalidIdChars = function (value) {
        var result = value.replace(/[a-zA-Z0-9_-]/g, '');
        return result;
    };
    TradeJournal.prototype.validIdChars = function (value) {
        var result = value.replace(/[^a-zA-Z0-9_-]/g, '');
        return result;
    };
    //
    // Flash "saved" to inform user of successful save
    //
    TradeJournal.prototype.flashSaved = function () {
        // using jquery
        var $saved = $("#save-indicator");
        $saved.stop(true, true).show();
        $saved.fadeOut(2500);
    };
    TradeJournal = __decorate([
        angular2_1.Component({
            selector: 'my-app'
        }),
        angular2_1.View({
            template: "\n\n        <!-- For now, just show open-trades page -->\n\n        <!-- Later, might switch between different views, \n             like open trades, history/archive, login page -->\n\n        <open-trades (initevent)=\"registerOpenTrades($event)\"> </open-trades>\n\n        <h4 id=\"save-indicator\" class=\"bg-success\" style=\"position:fixed; padding:10px 20px; right:5px; top:5px; display:none\">\n          Saved\n        </h4>\n        ",
            directives: [OpenTrades]
        }), 
        __metadata('design:paramtypes', [])
    ], TradeJournal);
    return TradeJournal;
})();
angular2_1.bootstrap(TradeJournal);
//# sourceMappingURL=main.js.map
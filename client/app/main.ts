/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="./tradesview.ts" />

require("firebase");
require("bootstrap");

declare var jQuery:any;

import {Component, View, bootstrap} from 'angular2/angular2';

var OpenTrades = require('./tradesview').OpenTrades;
var Firebase   = require('firebase/lib/firebase-web.js');

@Component({
    selector: 'my-app'
})

@View({
    template: `

        <!-- For now, just show open-trades page -->

        <!-- Later, might switch between different views, 
             like open trades, history/archive, login page -->

        <open-trades (initevent)="registerOpenTrades($event)"> </open-trades>

        <h4 id="save-indicator" class="bg-success" style="position:fixed; padding:10px 20px; right:5px; top:5px; display:none">
          Saved
        </h4>

        `,

    directives: [OpenTrades]
})

class TradeJournal {
    openTrades   : any;   // (OpenTrades, but Typescript complaining)
    fbRef        : Firebase;

    constructor() {
        console.log("main.ts: in TradeJournal constructor")

        this.fbRef      = new Firebase('https://trjournal.firebaseio.com');
        this.openTrades = null;
    }

    // Called via 'initevent' event from OpenTrades component
    registerOpenTrades(openTradesComp) {
        var _this = this;

        _this.openTrades = openTradesComp;
        
        _this.prepareDB(function() {
            // Register parent (and other initialization) after DB is ready
            _this.openTrades.registerParent(_this, _this.fbRef);
        });
    }

    // Current user, fixed to Ed for now
    userId() {
        return "eactracker@gmail.com";
    }

    dbUserId() {
        // Assume userId is an email address and replace with valid ID chars
        var res = this.userId().replace('@', '-at-').replace('.', '_');
        res = this.validIdChars(res);
        res = res.toLowerCase();
        return res;
    }

    prepareDB(doneCB) {
        var _this = this;
        
        _this.fbRef.once('value', function(data) {

            if (data.child('vocabs').exists()) {
                _this.prepareDBForUser(doneCB);
            } else {
                var dbSetup = {
                    vocabs : {
                        accounts   : {
                            Schwab : 'Schwab',
                            TD     : 'TD Ameritrade'
                        },
                        strategies : {
                            MM     : 'what MM stands for',
                            CC     : 'what CC stands for',
                            'CC-a' : 'what CC-a stands for'
                        }
                    }
                };

                _this.fbRef.update( dbSetup, function() {
                    _this.prepareDBForUser(doneCB);
                }); 
            }
        });       
    }

    prepareDBForUser(doneCB) {
        var _this = this;
        var userIdStr = _this.dbUserId();

        _this.fbRef.once('value', function(data) {

            if (data.child(userIdStr).exists()) {
                doneCB();
            } else {
                var userSetup = {};
                userSetup[userIdStr] = {
                    trades : { 
                        'dummy_dummy_dummy' : {
                            strategy   : 'dummy',
                            expiration : 'dummy',
                            
                            account    : 'dummy',
                            openDate   : '1900-01-01',
                            status     : 'dummy'
                        }
                    },
                    entries : {
                        'dummy_dummy_dummy' : {
                            '1900-01-01' : 'dummy'
                        },
                    },
                };

                // use set rather than update to init DB
                _this.fbRef.update( userSetup, function() {
                    doneCB();
                });
            }
        });
    }

    //
    // Valid ID string helper methods
    //
    // Only allow letters, numbers, underscore and dash characters, so it can 
    // be used for HTML ids, jquery, and Firebase keys
    //

    invalidIdChars(value) {
        var result = value.replace(/[a-zA-Z0-9_-]/g, '');
        return result;
    }

    validIdChars(value) {
        var result = value.replace(/[^a-zA-Z0-9_-]/g, '');
        return result;
    }

    //
    // Flash "saved" to inform user of successful save
    //

    flashSaved() {
        // using jquery
        var $saved = jQuery("#save-indicator");
        $saved.stop(true, true).show();
        $saved.fadeOut(2500);
    }
}

// similar to jQuery(document).ready(), but doesn't work in old IE browsers
document.addEventListener('DOMContentLoaded', function(){ 
    bootstrap(TradeJournal);
});


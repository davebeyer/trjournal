/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="./main.ts" />
/// <reference path="./jentries.ts" />

import {Component, View, NgFor, EventEmitter} from 'angular2/angular2';

declare var jQuery:any;

var Dropdown       = require('./dropdown').Dropdown;
var JournalEntries = require('./jentries').JournalEntries;

var formatDatetime = require('../public/js/utils').formatDatetime;

@Component({
    selector:   'open-trades',
    events:     ['initevent']     // NOTE that event names must be all lower case
})

@View({
    template: `
        <div class="container">

          <h2>Open Trades - {{userId}}</h2>

          <div id="open-trades">
            <table class="table-striped table-hover" style="width:100%">
              <tr>
                <th> Strategy   </th>
                <th> Expiration </th>
                <th> Opened     </th>
                <th> Account    </th>
              </tr>
              <tbody *ng-for="#trade of trades">
                <tr style="cursor:pointer" (click)="toggleEntries(trade)">
                  <td> {{trade.strategy}}   </td>
                  <td> {{trade.expiration}} </td>
                  <td> {{trade.openDate}}   </td>
                  <td> {{trade.account}}    </td>
                </tr>
                <tr [id]="journalId(trade)" style="display:none">
                  <td colspan="4" style="padding:10px 0px 10px 30px">
                    <!-- "$event" parameter name appears to be special here -->
                    <journal-entries (initevent)="registerJournalEntries($event)" [journal-id-str]="tradeIdStr(trade)">
                    </journal-entries>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div id="new-trade">
            <h3>New Trade:</h3>

            <form class="form-horizontal">

              <div class="form-group">
                <label class="col-sm-2 control-label" for="new-strat">Strategy</label>
                <div class="col-sm-10">
                  <dropdown [options]="strategyVocab" (initevent)="registerDropdown($event)" id="new-strat" name="strategy">
                  </dropdown>   
                </div>
              </div>

              <div class="form-group">
                <label class="col-sm-2 control-label" for="new-exp">Expiration</label>
                <div class="col-sm-10">
                  <input type="text" class="form-control input-sm" id="new-exp" #newexp placeholder="Dec14, Jan15-a, ...">
                </div>
              </div>

              <div class="form-group">
                <label class="col-sm-2 control-label" for="new-account">Account</label>
                <div class="col-sm-10">
                  <dropdown [options]="accountVocab" (initevent)="registerDropdown($event)" id="new-account" name="account">
                  </dropdown>   
                </div>
              </div>

              <div class="form-group">
                <div class="col-sm-offset-2 col-sm-10">
                  <button type="button" (click)="newTrade(newexp.value)" class="btn btn-default">
                    Save New Trade
                  </button>
                  <p [hidden]="newTradeErr.length === 0" class="text-warning">{{newTradeErr}}</p>
                </div>
              </div>

            </form>

          </div>
        </div>
        `,
    directives: [NgFor, Dropdown, JournalEntries]
})


export class OpenTrades {
    trades        : Array<any>;

    jEntryComps   : any;
    dropdowns     : any;

    strategyVocab : Array<string>;
    accountVocab  : Array<string>;

    newTradeErr   : string;

    userId        : string;

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
    fbRef         : Firebase;      // ToDo: use dependency injector to get Database service
    initevent     : EventEmitter;

    constructor() {
        // Only initialize locally instatiated data here 
        // (angular2-dependent data has not yet been fully initialized)

        this.initevent = new EventEmitter();

        this.parent        = null;  // will be set by the parent
        this.fbRef         = null;

        this.trades        = [];
        this.userId        = '';

        this.jEntryComps   = {};
        this.dropdowns     = {};

        this.strategyVocab = [];
        this.accountVocab  = [];

        this.newTradeErr   = "";
    }

    onInit() {
        // onInit() is a angular2 lifecycle method called 
        // automatically after angular2 has completed initialization

        console.log("onInit: for OpenTrades", this);
        this.initevent.next(this); // send initevent to parent component
    }

    registerParent(parent, fbRef) {
        this.parent = parent;
        this.fbRef  = fbRef;
        
        this.userId = parent.userId();

        var _this    = this;

        // Init vocabs for dropdown lists
        _this.fbRef.child('vocabs').once('value', function(snapshot) {
            var data = snapshot.val();
            var value;
            var invalidChars;
            for (value in data.accounts) {
                invalidChars = _this.invalidIdCharsFriendly(value);
                if (invalidChars) {
                    alert(`Warning, invalid characters (${invalidChars}) will be removed for 'accounts' vocabulary entry "${value}."`);
                    value = _this.validIdChars(value);
                }
                _this.accountVocab.push(value);
            }
            for (value in data.strategies) {
                _this.strategyVocab.push(value);
            }
        });

        //
        // Watch for new trades.
        //
        // NOTE, contrary to the event name ("child_added"), this will also
        // trigger once for each child present initially (not JUST when new children are added).
        //

        var dbUserId = _this.parent.dbUserId();

        _this.fbRef.child(dbUserId).child('trades').on('child_added', function(tradeData, prevChildKey) {
            console.log("registering new trade", tradeData);
            _this.handleTradeDisplay(tradeData.val());
        });
    }

    handleTradeDisplay(tradeObj) {
        if (tradeObj.status !== 'open') {
            return; // ignore, closed trade
        }

        // Insert into list according to openDate
        var i = 0;
        while (i < this.trades.length && tradeObj.openDate >= this.trades[i].openDate) {
            i += 1;
        }

        // Insert into list
        this.trades.splice(i, 0, tradeObj);
    }

    //
    // Track Dropdown child components
    // 

    registerDropdown(dropdownComp) {
        this.dropdowns[dropdownComp.name] = dropdownComp;
    }

    //
    // Handling creation of new trades
    //

    newTrade(expiration) {
        var dateStr  = formatDatetime();  // uses current date/time by default
        var strategy = this.dropdowns.strategy.currentValue();
        var account  = this.dropdowns.account.currentValue();

        //
        // First, validate information for new trade
        //

        this.newTradeErr = "";

        if (!strategy) {
            this.newTradeErr = "Must select a strategy";
        }

        if (!account) {
            if (this.newTradeErr) {
                this.newTradeErr += ", and an account";
            } else {
                this.newTradeErr = "Must select an account";
            }
        }

        expiration = jQuery.trim(expiration);

        if (!expiration) {
            if (this.newTradeErr) {
                this.newTradeErr += ", and an expiration";
            } else {
                this.newTradeErr = "Must enter an expiration";
            }
        } else {
            var invalidChars = this.invalidIdCharsFriendly(expiration);
            if (invalidChars) {
                if (this.newTradeErr) {
                    this.newTradeErr += `, and expiration contains invalid chars (${invalidChars})`;
                } else {
                    this.newTradeErr = `Expiration contains invalid chars (${invalidChars})`;
                }
            }
        }

        if (this.newTradeErr) {
            this.newTradeErr += '.';
            return;
        }

        //
        // Finally, check to be sure this key isn't already being used
        //

        var newTradeObj = {
            strategy   : strategy,
            expiration : expiration,
            account    : account,

            openDate   : dateStr,
            status     : 'open'
        }

        var dbUserId   = this.parent.dbUserId();
        var tradeIdStr = this.tradeIdStr(newTradeObj);
        var _this       = this;

        this.fbRef.child(dbUserId).child('trades').once('value', function(data) {
            if (data.child(tradeIdStr).exists()) {
                _this.newTradeErr = `Sorry, you have already used this combination of strategy_expiration_account (${tradeIdStr}).`;
            } else {
                //
                // Proceed with adding new trade to DB
                //

                console.log("New trade:", newTradeObj);

                var dbObj = {};
                
                dbObj[tradeIdStr] = newTradeObj;

                _this.fbRef.child(dbUserId).child('trades').update(dbObj, function() {
                    _this.parent.flashSaved();
                });
            }
        });
    }

    //
    // Methods to support JournalEntries child components
    //

    registerJournalEntries(jEntryComp) {
        this.jEntryComps[this.tradeIdStr(jEntryComp)] = jEntryComp;
        
        jEntryComp.registerParent(this, this.fbRef);
        console.log("registerJournalEntries: JournalEntries info", jEntryComp);
    }

    toggleEntries(tradeObj) {
        // using jquery to toggle visibility of associated journal entries
        // Unfortunately, can't use slideUp/Down animations on table rows
        var $obj = jQuery('#' + this.journalId(tradeObj));
        if ($obj.is(":visible")) {
            $obj.fadeOut();
        } else {
            $obj.fadeIn();
        }
    }

    //
    // Trade ID & journal ID 
    //

    tradeId(tradeObj) {
        return "trade-" + this.tradeIdStr(tradeObj);
    }

    journalId(tradeObj) {
        return "journal-" + this.tradeIdStr(tradeObj);
    }

    tradeIdStr(tradeObj) {
        return jQuery.trim(tradeObj.strategy).toLowerCase()   + '_' + 
               jQuery.trim(tradeObj.expiration).toLowerCase() + '_' + 
               jQuery.trim(tradeObj.account).toLowerCase();
    }

    invalidIdCharsFriendly(value) {
        var invalidChars = this.parent.invalidIdChars(value);
        var res = '';

        for (var i = 0; i < invalidChars.length; i++) {
            if (i > 0) { res += ', '; }

            switch(invalidChars[i]) {
            case ' ':
                res += '<SPACE>';
                break;
            default:
                res += invalidChars[i];
            }
        }
        return res;
    }

    validIdChars(value) {
        return this.parent.validIdChars(value);
    }
}

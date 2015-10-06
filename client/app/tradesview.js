/// <reference path="../../typings/angular2/angular2.d.ts" />
/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/firebase/firebase.d.ts" />
/// <reference path="./main.ts" />
/// <reference path="./jentries.ts" />
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
var Dropdown = require('./dropdown.js').Dropdown;
var JournalEntries = require('./jentries.js').JournalEntries;
var formatDatetime = require('assets/js/utils.js').formatDatetime;
var OpenTrades = (function () {
    function OpenTrades() {
        // Only initialize locally instatiated data here 
        // (angular2-dependent data has not yet been fully initialized)
        this.initevent = new angular2_1.EventEmitter();
        this.parent = null; // will be set by the parent
        this.fbRef = null;
        this.trades = [];
        this.userId = '';
        this.jEntryComps = {};
        this.dropdowns = {};
        this.strategyVocab = [];
        this.accountVocab = [];
        this.newTradeErr = "";
    }
    OpenTrades.prototype.onInit = function () {
        // onInit() is a angular2 lifecycle method called 
        // automatically after angular2 has completed initialization
        console.log("onInit: for OpenTrades", this);
        this.initevent.next(this); // send initevent to parent component
    };
    OpenTrades.prototype.registerParent = function (parent, fbRef) {
        this.parent = parent;
        this.fbRef = fbRef;
        this.userId = parent.userId();
        var self = this;
        // Init vocabs for dropdown lists
        self.fbRef.child('vocabs').once('value', function (snapshot) {
            var data = snapshot.val();
            var value;
            var invalidChars;
            for (value in data.accounts) {
                invalidChars = self.invalidIdCharsFriendly(value);
                if (invalidChars) {
                    alert("Warning, invalid characters (" + invalidChars + ") will be removed for 'accounts' vocabulary entry \"" + value + ".\"");
                    value = self.validIdChars(value);
                }
                self.accountVocab.push(value);
            }
            for (value in data.strategies) {
                self.strategyVocab.push(value);
            }
        });
        //
        // Watch for new trades.
        //
        // NOTE, contrary to the event name ("child_added"), this will also
        // trigger once for each child present initially (not JUST when new children are added).
        //
        var dbUserId = self.parent.dbUserId();
        self.fbRef.child(dbUserId).child('trades').on('child_added', function (tradeData, prevChildKey) {
            console.log("registering new trade", tradeData);
            self.handleTradeDisplay(tradeData.val());
        });
    };
    OpenTrades.prototype.handleTradeDisplay = function (tradeObj) {
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
    };
    //
    // Track Dropdown child components
    // 
    OpenTrades.prototype.registerDropdown = function (dropdownComp) {
        this.dropdowns[dropdownComp.name] = dropdownComp;
    };
    //
    // Handling creation of new trades
    //
    OpenTrades.prototype.newTrade = function (expiration) {
        var dateStr = formatDatetime(); // uses current date/time by default
        var strategy = this.dropdowns.strategy.currentValue();
        var account = this.dropdowns.account.currentValue();
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
            }
            else {
                this.newTradeErr = "Must select an account";
            }
        }
        expiration = $.trim(expiration);
        if (!expiration) {
            if (this.newTradeErr) {
                this.newTradeErr += ", and an expiration";
            }
            else {
                this.newTradeErr = "Must enter an expiration";
            }
        }
        else {
            var invalidChars = this.invalidIdCharsFriendly(expiration);
            if (invalidChars) {
                if (this.newTradeErr) {
                    this.newTradeErr += ", and expiration contains invalid chars (" + invalidChars + ")";
                }
                else {
                    this.newTradeErr = "Expiration contains invalid chars (" + invalidChars + ")";
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
            strategy: strategy,
            expiration: expiration,
            account: account,
            openDate: dateStr,
            status: 'open'
        };
        var dbUserId = this.parent.dbUserId();
        var tradeIdStr = this.tradeIdStr(newTradeObj);
        var self = this;
        this.fbRef.child(dbUserId).child('trades').once('value', function (data) {
            if (data.child(tradeIdStr).exists()) {
                self.newTradeErr = "Sorry, you have already used this combination of strategy_expiration_account (" + tradeIdStr + ").";
            }
            else {
                //
                // Proceed with adding new trade to DB
                //
                console.log("New trade:", newTradeObj);
                var dbObj = {};
                dbObj[tradeIdStr] = newTradeObj;
                self.fbRef.child(dbUserId).child('trades').update(dbObj, function () {
                    self.parent.flashSaved();
                });
            }
        });
    };
    //
    // Methods to support JournalEntries child components
    //
    OpenTrades.prototype.registerJournalEntries = function (jEntryComp) {
        this.jEntryComps[this.tradeIdStr(jEntryComp)] = jEntryComp;
        jEntryComp.registerParent(this, this.fbRef);
        console.log("registerJournalEntries: JournalEntries info", jEntryComp);
    };
    OpenTrades.prototype.toggleEntries = function (tradeObj) {
        // using jquery to toggle visibility of associated journal entries
        // Unfortunately, can't use slideUp/Down animations on table rows
        var $obj = $('#' + this.journalId(tradeObj));
        if ($obj.is(":visible")) {
            $obj.fadeOut();
        }
        else {
            $obj.fadeIn();
        }
    };
    //
    // Trade ID & journal ID 
    //
    OpenTrades.prototype.tradeId = function (tradeObj) {
        return "trade-" + this.tradeIdStr(tradeObj);
    };
    OpenTrades.prototype.journalId = function (tradeObj) {
        return "journal-" + this.tradeIdStr(tradeObj);
    };
    OpenTrades.prototype.tradeIdStr = function (tradeObj) {
        return $.trim(tradeObj.strategy).toLowerCase() + '_' +
            $.trim(tradeObj.expiration).toLowerCase() + '_' +
            $.trim(tradeObj.account).toLowerCase();
    };
    OpenTrades.prototype.invalidIdCharsFriendly = function (value) {
        var invalidChars = this.parent.invalidIdChars(value);
        var res = '';
        for (var i = 0; i < invalidChars.length; i++) {
            if (i > 0) {
                res += ', ';
            }
            switch (invalidChars[i]) {
                case ' ':
                    res += '<SPACE>';
                    break;
                default:
                    res += invalidChars[i];
            }
        }
        return res;
    };
    OpenTrades.prototype.validIdChars = function (value) {
        return this.parent.validIdChars(value);
    };
    OpenTrades = __decorate([
        angular2_1.Component({
            selector: 'open-trades',
            events: ['initevent'] // NOTE that event names must be all lower case
        }),
        angular2_1.View({
            template: "\n        <div class=\"container\">\n\n          <h2>Open Trades - {{userId}}</h2>\n\n          <div id=\"open-trades\">\n            <table class=\"table-striped table-hover\" style=\"width:100%\">\n              <tr>\n                <th> Opened     </th>\n                <th> Strategy   </th>\n                <th> Expiration </th>\n                <th> Account    </th>\n              </tr>\n              <tbody *ng-for=\"#trade of trades\">\n                <tr style=\"cursor:pointer\" (click)=\"toggleEntries(trade)\">\n                  <td> {{trade.openDate}}   </td>\n                  <td> {{trade.strategy}}   </td>\n                  <td> {{trade.expiration}} </td>\n                  <td> {{trade.account}}    </td>\n                </tr>\n                <tr [id]=\"journalId(trade)\" style=\"display:none\">\n                  <td colspan=\"4\" style=\"padding:10px 0px 10px 30px\">\n                    <!-- \"$event\" parameter name appears to be special here -->\n                    <journal-entries (initevent)=\"registerJournalEntries($event)\" [journal-id-str]=\"tradeIdStr(trade)\">\n                    </journal-entries>\n                  </td>\n                </tr>\n              </tbody>\n            </table>\n          </div>\n\n          <div id=\"new-trade\">\n            <h3>New Trade:</h3>\n\n            <form class=\"form-horizontal\">\n\n              <div class=\"form-group\">\n                <label class=\"col-sm-2 control-label\" for=\"new-strat\">Strategy</label>\n                <div class=\"col-sm-10\">\n                  <dropdown [options]=\"strategyVocab\" (initevent)=\"registerDropdown($event)\" id=\"new-strat\" name=\"strategy\">\n                  </dropdown>   \n                </div>\n              </div>\n\n              <div class=\"form-group\">\n                <label class=\"col-sm-2 control-label\" for=\"new-exp\">Expiration</label>\n                <div class=\"col-sm-10\">\n                  <input type=\"text\" class=\"form-control input-sm\" id=\"new-exp\" #newexp placeholder=\"Dec14, Jan15-a, ...\">\n                </div>\n              </div>\n\n              <div class=\"form-group\">\n                <label class=\"col-sm-2 control-label\" for=\"new-account\">Account</label>\n                <div class=\"col-sm-10\">\n                  <dropdown [options]=\"accountVocab\" (initevent)=\"registerDropdown($event)\" id=\"new-account\" name=\"account\">\n                  </dropdown>   \n                </div>\n              </div>\n\n              <div class=\"form-group\">\n                <div class=\"col-sm-offset-2 col-sm-10\">\n                  <button type=\"button\" (click)=\"newTrade(newexp.value)\" class=\"btn btn-default\">\n                    Save New Trade\n                  </button>\n                  <p [hidden]=\"newTradeErr.length === 0\" class=\"text-warning\">{{newTradeErr}}</p>\n                </div>\n              </div>\n\n            </form>\n\n          </div>\n        </div>\n        ",
            directives: [angular2_1.NgFor, Dropdown, JournalEntries]
        }), 
        __metadata('design:paramtypes', [])
    ], OpenTrades);
    return OpenTrades;
})();
exports.OpenTrades = OpenTrades;
//# sourceMappingURL=tradesview.js.map
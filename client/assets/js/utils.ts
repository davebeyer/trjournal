/// <reference path="../../../typings/angular2/angular2.d.ts" />
/// <reference path="../../../typings/jquery/jquery.d.ts" />


////////////////////////////////////////////////////////////////////////
//
// String & formatting utilities
//
// Also see underscore.string module
// http://epeli.github.io/underscore.string/#api
//

export function formatDatetime(dt?:Date)
{
    if (dt === undefined) {
        dt = new Date();
    }

    var res = dt.toISOString().slice(0, 19);
    res = res.replace('T', ' ');

    return res;
}

export function formatDate(dt?:Date)
{
    if (dt === undefined) {
        dt = new Date();
    }

    var res = dt.toISOString().slice(0, 10);

    return res;
}

export function camelCase(s:string)
{
    var parts = s.split('_');
    if (parts.length <= 1) { return s; }

    var res = parts.shift();
    while(parts.length > 0) {
        res += capitalize(parts.shift());
    }
    return res;
}

export function capitalize(s:string)
{
    return s[0].toUpperCase() + s.slice(1);
}

export function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

//
// Format number with comma separators
//

export function formatNumber(x) {
    try {
        var parts = x.toString().split(".");
        parts[0]  = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    } catch (err) {
        console.error("GVUtils.formatNumber: %s", err);
        return x;
    }

    // Browser support unclear & may truncate decimal points?
    // return x.toLocaleString();
}

////////////////////////////////////////////////////////////////////////
//
// Object conversion utilities
//

export function convertObjOfObjsToList(obj:any, options?:any) {
    if (!options) {options = {};}

    if (!options.keyFieldName) {
        options.keyFieldName = "_object_key_index_";
    }

    var objList = [];
    var indexes = Object.keys(obj);
    var index;

    for (var i = 0; i < indexes.length; i++) {
        index = indexes[i];

        // set the key field on the object too
        obj[index][options.keyFieldName] = index;  

        // Add to list
        objList.push(obj[index]);
    }

    // Sort objList by options.keyFieldName
    objList.sort(function(x, y) {
        var v1, v2;
        if ( isNumber(x[options.keyFieldName]) && isNumber(y[options.keyFieldName]) ) {
            v1 = parseFloat(x[options.keyFieldName]);
            v2 = parseFloat(y[options.keyFieldName]);
        } else {
            v1 = x[options.keyFieldName];
            v2 = y[options.keyFieldName];
        }

        if (v1 < v2) { return -1; }
        else         { return  1; }
    });

    return objList;
}

//
// We have an object full of objects to be listed in CSV file
//

export function convertObjOfObjsToCSVStr(obj:any, options?:any) {
    if (!options) {options = {};}

    var objList   = convertObjOfObjsToList(obj, options);
    var fieldList = options.fieldList;

    if (!fieldList) {
        var fields  = {};
        var indexes = Object.keys(obj);
        var index;
        var newFields;

        for (var i = 0; i < indexes.length; i++) {
            index = indexes[i];

            // Check for new fields
            newFields = Object.keys(obj[index]);
            for (var j = 0; j < newFields.length; j++) {
                if (! (newFields[j] in fields)) {
                    fields[newFields[j]] = newFields[j];
                }
            }
        }

        // Convert to fields to list
        var fieldProps = Object.keys(fields);
        fieldList = [];
        for (i = 0; i < fieldProps.length; i++) {
            fieldList.push( {'prop' : fieldProps[i], 'name' : fields[fieldProps[i]]} );
        }

        // Sort by field title
        fieldList.sort(function(x, y) {
            if (x.name < y.name) { return -1; }
            else                 { return  1; }
        });
    }

    return convertListOfObjsToCSVStr(objList, {fieldList : fieldList});
}

export function convertListOfObjsToCSVStr(objList:any, options?:any) {
    if (!options) { options = {}; }

    if (!options.fieldList) {
        console.error("GVUtils:convertListOfObjsToCSVStr - currently must include fieldList");
        return '';
    }

    function newValue(rowStr, value, type?) {
        var res = '';

        if (rowStr.length > 0) {
            res += ',';   // be sure not to add spaces... can confuse Excel with commas in quoted fields 
        }

        if (value === undefined || value === null) {
            if (type === 'int') { return res + '0'; }
            else                { return res + '';  }
        } else if (isNumber(value)) {
            return res + value;
        } else {
            value = value.replace(/"/g, '""');  // escape double-quotes with two double-quotes
            return res + '"' + value + '"';
        }
    }

    function newRow(rowStr) {
        return rowStr + '\n';
    }

    var fields = options.fieldList;
    var res    = '';
    var row;
    var propName;

    // Header
    row = ''
    for (var i = 0; i < fields.length; i++) {
        row += newValue(row, fields[i].name);
    }
    res += newRow(row);

    // Each record
    for (var j = 0; j < objList.length; j++) {
        row = ''
        for (var i = 0; i < fields.length; i++) {
            propName = fields[i].prop;
            row += newValue(row, objList[j][propName], fields[i].type);
        }
        res += newRow(row)
    }

    return res;
}

////////////////////////////////////////////////////////////////////////
//
// Object utilities
//

//
// Clone object, avoiding inherited properties
//
// BTW, an alternate simple method is: JSON.parse(JSON.stringify(obj));
//

export function clone(obj:any, ignores?:string[]) {
    var copy    : any;
    var newItem : any;
    var props   : string[];
    var prop    : string;
    var i       : number;

    // Always set function values to null across api
    if (typeof(obj) == "function") {
        return null;  //  null rather than undefined so, e.g., objects are set with keys but values set to null
    }

    // Simple types
    if (null == obj || "object" != typeof obj) {
        return obj;
    }

    // Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Arrays
    if (Array.isArray(obj)) {
        copy = [];
        for (i = 0; i < obj.length; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Plain objects
    if (obj instanceof Object) {
        copy = {};
        props = Object.keys(obj);
        for (i = 0; i < props.length; i++) {
            prop = props[i];
            if (!ignores || ignores.indexOf(prop) === -1) {
                newItem    = clone(obj[prop]);
                if (newItem !== undefined) {
                    copy[prop] = newItem;
                }
            }
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

////////////////////////////////////////////////////////////////////////
//
// Miscellaneous
//

//
// check whether a valid number
//
export function isNumber(n) {
    if (isNaN(parseFloat(n))) { return false; }
    if (! isFinite(n))        { return false; }

    return true;
}

//
// Random integer
//

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

export function random(min, max) {
    return (Math.random() * (max - min)) + min;
}

//
// Beep sound
// 
// Alternatively, for a beep, make a sound file and play that!
//   (new Audio("file.wav")).play();

export function beep() {
    var snd = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
}

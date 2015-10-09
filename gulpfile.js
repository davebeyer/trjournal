var browserify = require('browserify');
var watchify   = require('watchify');
var gulp       = require('gulp');
var source     = require('vinyl-source-stream');

gulp.task('watch-dev', function() {

    var b = browserify({
	// Files to operate on
	entries: 'client/app/main.ts',

	// Generate source maps (.js.map files) for debugging
	debug: true,

	// Required for running thru watchify
	cache:        {},
	packageCache: {},
	fullPaths:    true  // Needed?
    });

    // Add Typescript transpile plugin
    b.plugin('tsify');   // , { noImplicitAny: false })

    var w = watchify(b);

    w.on('update', function() {
	logForm({style : chalk.blue}, "Updating bundle ... ");

	doBundle(w, function() {
	    logForm({style : chalk.blue}, "Update done");
	});

    });

    logForm({style : chalk.blue}, "Building bundle ... ");

    doBundle(w, function() {
	logForm({style : chalk.blue}, "Done building, now watching for changes ... ");
    });
});

function doBundle(bundler, doneCB) {
    if (doneCB === undefined) { var doneCB = function() {}; }

    bundler.bundle()
        // End callback
	.on('end', function() {
	    if (doneCB) { doneCB(); }
	})

        // Handle typescript compile errors
	.on('error', function (error) { 
	    logError(error.toString()); 
	})

        // vinyl-source-stream makes the bundle compatible with gulp
        .pipe(source('bundle.js'))

        // Output the file
        .pipe(gulp.dest('./client/build'));
}

gulp.task('default', ['watch-dev']);


/////////////////////////////////////////////////////////////////////////////////
//
// Output formatting
//

var chalk      = require('chalk');
var dateformat = require('dateformat');
var util       = require('util');

function logForm(options) {
    // All args following options
    var args = Array.prototype.slice.call(arguments, 1);    
    
    var outStr = '';

    if (!options.noTime) {
	outStr += '[' + chalk.grey(dateformat(new Date(), 'HH:MM:ss')) + '] ';
    }

    var textStr = util.format.apply(this, args);

    if (options.style) {
	textStr = options.style(textStr);
    }

    outStr += textStr;

    if (! options.noNewline) {
	outStr += '\n';
    }

    process.stdout.write(outStr);
};

function log() {
    // grab all arguments
    var args = Array.prototype.slice.call(arguments);
    args.unshift({});  // add empty options
    logForm.apply(this, args);
}

function logError() {
    var args = Array.prototype.slice.call(arguments);
    logForm({noNewline : true, style : chalk.bgRed.white.bold}, " ERROR ");
    logForm({noNewline : true, noTime : true}, " ");
    args.unshift({noTime : true, style: chalk.red.bold});
    logForm.apply(this, args);
}

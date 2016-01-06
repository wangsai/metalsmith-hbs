
var hbs = require('express-hbs');
var debug = require('debug')('metalsmith-hbs');
var _ = require('lodash');
var eachLimit = require('async').eachLimit;
var extend = require('extend');
var match = require('multimatch');
var omit = _.omit;
var pick = _.pick;

/**
 * Expose `plugin`.
 */

module.exports = plugin;

/**
 * Settings.
 */

var settings = ['partialsDir', 'blockHelperName', 'contentHelperName',
                'defaultLayout', 'extname', 'handlebars',
                'i18n', 'layoutsDir', 'templateOptions',
                'beautify', 'onCompile', 'pattern', 'defaultTemplate',
                'templatesDir', 'concurrency'];

var templates = 'templates'; //default templates' folder
var ext = '.hbs';

// Copied from express-hbs docs
//
 // partialsDir: "{String/Array} [Required] Path to partials templates, one or several directories",

 //  // OPTIONAL settings
 //  blockHelperName: "{String} Override 'block' helper name.",
 //  contentHelperName: "{String} Override 'contentFor' helper name.",
 //  defaultLayout: "{String} Absolute path to default layout template",
 //  extname: "{String} Extension for templates, defaults to `.hbs`",
 //  handlebars: "{Module} Use external handlebars instead of express-hbs dependency",
 //  i18n: "{Object} i18n object",
 //  layoutsDir: "{String} Path to layout templates",
 //  templateOptions: "{Object} options to pass to template()",
 //  beautify: "{Boolean} whether to pretty print HTML, see github.com/einars/js-beautify .jsbeautifyrc,

 //  // override the default compile
 //  onCompile: function(exhbs, source, filename) {
 //    var options;
 //    if (filename && filename.indexOf('partials') > -1) {
 //      options = {preventIndent: true};
 //    }
 //    return exhbs.handlebars.compile(source, options);
 //  }

 // Additional settings:
 // pattern: which file type should render with this plugin

function plugin(opts){
  opts = opts || {};
  if (!_.isObject(opts)) throw new Error('option should be an Object');

  var params = omit(opts, settings) || {};
  var options = pick(opts, settings) || {};
  var pattern = opts.pattern || '**';

  options.templatesDir = options.templatesDir || templates;
  options.layoutsDir = options.layoutsDir || options.templatesDir; //未指定则与 templatesDir 一致
  options.partialsDir = options.partialsDir || (options.templatesDir + '/partials'); //未指定则默认为位于 templatesDir 目录下的 partials 目录

  options.defaultTemplate = options.defaultTemplate || 'default';

  options.extname = options.extname || ext;

  return function(files, metalsmith, done){
    var metadata = metalsmith.metadata();
    var render;
    var matches = {};
    var ext = options.extname;
    var reg = new RegExp(ext + '$', 'i');
    var concurrency = options.concurrency || Infinity;

    //没有明确指定的话，不为其设置默认值
    if(options.defaultLayout) {
      options.defaultLayout = metalsmith.path(options.layoutsDir, options.defaultLayout);

      if(!reg.test(options.defaultLayout)) options.defaultLayout += ext;
    }

    options.templatesDir = metalsmith.path(options.templatesDir);
    options.layoutsDir = metalsmith.path(options.layoutsDir);
    options.partialsDir = metalsmith.path(options.partialsDir);

    render = hbs.express4(options);

    function check(file){
      var data = files[file];
      // if (!utf8(data.contents)) return false;
      if (pattern && !match(file, pattern)[0]) return false;
      return true;
    }

    Object.keys(files).forEach(function(file){
      if (!check(file)) return;
      debug('stringifying file: %s', file);
      var data = files[file];
      data.contents = data.contents.toString();
      matches[file] = data;
    });

    eachLimit(Object.keys(matches), concurrency, convert, done);

    function convert(file, done){
      debug('converting file: %s', file);
      var data = files[file];
      var clonedParams = extend(true, {}, params);
      var clone = extend({settings:{}}, clonedParams, metadata, data);
      var templatePath = data.template || options.defaultTemplate;

      templatePath = metalsmith.path(options.templatesDir, templatePath);

      if(!reg.test(templatePath)) templatePath += ext;

      render(templatePath, clone, function(err, str){
        if (err) return done(err);
        data.contents = new Buffer(str);
        debug('converted file: %s', file);
        done();
      });
    }
  };
}

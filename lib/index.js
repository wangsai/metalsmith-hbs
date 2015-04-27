
var hbs = require('express-hbs');
var debug = require('debug')('metalsmith-hbs');
var _ = require('lodash');
var each = require('async').each;
var extend = require('extend');
var match = require('multimatch');
var omit = require('lodash.omit');
var utf8 = require('is-utf8');

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
                'beautify', 'onCompile', 'pattern', 'defaultTemplate'];

var templates = 'templates'; //default templates' folder
var layouts = templates;
var partials = 'templates/partials'; //default partials' folder
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

  var params = omit(opts, settings);
  var pattern = opts.pattern;

  opts.templatesDir = opts.templatesDir || templates;
  opts.layoutsDir = opts.layoutsDir || layouts;
  opts.partialsDir = opts.partialsDir || partials;

  opts.extname = opts.extname || ext;

  return function(files, metalsmith, done){
    var metadata = metalsmith.metadata();
    var render;
    var matches = {};
    var ext = opts.extname;
    var reg = new RegExp(ext + '$', 'i')

    opts.templatesDir = metalsmith.path(opts.templatesDir);
    opts.layoutsDir = metalsmith.path(opts.layoutsDir);
    opts.partialsDir = metalsmith.path(opts.partialsDir);

    if(opts.defaultLayout) {
      opts.defaultLayout = metalsmith.path(layouts, opts.defaultLayout);

      if(!reg.test(opts.defaultLayout)) opts.defaultLayout += ext;
    }

    if(opts.defaultTemplate) {
      opts.defaultTemplate = metalsmith.path(templates, opts.defaultTemplate);

      if(!reg.test(opts.defaultTemplate)) opts.defaultTemplate += ext;
    }

    render = hbs.express4(opts);

    function check(file){
      var data = files[file];
      if (!utf8(data.contents)) return false;
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

    each(Object.keys(matches), convert, done);

    function convert(file, done){
      debug('converting file: %s', file);
      var data = files[file];
      var clonedParams = extend(true, {}, params);
      var clone = extend({settings:{}}, clonedParams, metadata, data);
      var templatePath = data.template? metalsmith.path(templates, data.template) : opts.defaultTemplate;

      if(!templatePath) return done();

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

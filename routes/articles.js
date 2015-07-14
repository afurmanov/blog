var path = require('path');
var glob = require('glob');
var Q = require('q');
var FS = require("q-io/fs");
var _ = require('underscore');
var marked = require('marked');
var hljs = require('highlight.js');

var articles = function(root) {
  return {
    read : function(article) {
      return this.find(article).then(article.content);
    },

    find : function(articleId) {
      var foundArticle = Q.defer();

      this.scan().then( function(articles) {
        var found = _.find(articles, function(article) {
          return articleId === article.id;
        });
        if (found) {
          foundArticle.resolve(found);
        } else {
          foundArticle.reject("No article matching " + articleId + " could be found.");
        }
      }).fail(foundArticle.reject);
      return foundArticle.promise;
    },

    scan : function() {
      console.log("Scanning articles in'" + root + '"');
      var scan = Q.defer();
      glob(root + "/**/*.markdown", {}, function (error, files) {
        if (error) {
          scan.reject(error);
        } else {
          var articles = [];
          _.each(files, function(file) {
            this._readArticle(file).then( function(article) {
              articles.push(article);
              if (articles.length == files.length) {
                scan.resolve(articles);
              }
            }).fail(scan.reject);
          }.bind(this));
        }
      }.bind(this));
      return scan.promise;
    },

    _readArticle : function(file) {
      console.log('reading article from file: ' + file);
      return FS.read(file).then( function(content) {
        return this._parse(path.basename(file), content);
      }.bind(this));
    },

    _parse : function(fileName, content) {
      var result = {};
      var lines = content.split( /\n/g );
      var significantLines = [];
      var ignoreProperties = false;
      props = {};
      lines.forEach( function( line ) {
        if (!ignoreProperties) {
          var match = /^([^:]+):([^:]+)/.exec(line);
          if (match) {
            var propName = match[1].trim().toLowerCase();
            var propValue = match[2].trim();
            props[propName] = propValue;
          } else {
            ignoreProperties = true;
          }
        }
        else {
          significantLines.push(this._preprocess(line));
        }
      }.bind(this));

      var name = fileName.replace( /\.[^/.]+$/, "");
      result.id = props.slug || name;
      result.content = marked(significantLines.join("\n"));
      result.author = props.author;
      result.date = props.date;
      result.title = props.title || name;
      return result;
    },

    _preprocess : function(line) {
      var result = line;
      var footnote = /^(\[\^(\d)\])/.exec(line);
      var footnoteReference = /(\[\^(\d)\])/.exec(line);
      var n = null;
      if (footnote) {
        n = footnote[2];
        result = n + '. <p id="fn:' + n + '">' + line.replace(footnote[1], '');
        result += '<a href="#fnref:' + n + '" rev="footnote">↩</a>';
        result += '</p>';
      } else if (footnoteReference) {
        n = footnoteReference[2];
        result = result.replace(footnoteReference[1], '<sup id="fnref:' + n + '"><a href="#fn:' + n + '" rel="footnote">' + n + '</a></sup>');
      }
      return result;
    }
  };
};

marked.setOptions({
  highlight: function (code, lang) {
    if (!lang) {
      lang = 'ruby';
    }
    var result = hljs.highlight(lang, code).value;
    return result;
  }
});

module.exports = function(rootDirectory) {
  return articles(rootDirectory);
};

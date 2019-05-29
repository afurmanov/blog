// let browserify to pick this dependency
require('./../templates/all.js')

var PageView = function(application) {
  this.application = application;
};

PageView.prototype.set = function(pagePart, view) {
  view.render($(pagePart));
};

PageView.prototype.error = function(message) {
  this.alert('alert', message);
};

PageView.prototype.alert = function(kind, message) {
  var compiled = _.template(JST.raw['client/templates/alerts']);
  var html = compiled({kind:kind, message:message});
  $("#content").append(html);
};

module.exports = PageView;

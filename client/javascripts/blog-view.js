var blogEndPoints = require('./blog-end-points');
var events = require('./blog-events');

BlogView = function(posts) {
  this.posts = posts;

};

BlogView.prototype.render = function($inElement) {
  var compiled = _.template(JST.raw['client/templates/blog-view']);
  var html = compiled({posts:this.posts});
  $inElement.html(html);
  this._bindEvents();
};

BlogView.prototype._bindEvents = function() {
  $('.posts .post').on('click', function(ev) {
    var data = $(ev.target).closest(".post").data();
    PubSub.publish(events.POST_SELECTED, data.id);
    return false;
  });
};

module.exports = BlogView;

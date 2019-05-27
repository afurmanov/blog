// let browserify to pick this dependency
require('./../templates/all.js')

var PostView = function(post) {
   this.post = post;
};

PostView.prototype.render = function($inElement) {
  var compiled = _.template(JST.raw['client/templates/post-view']);
  var html = compiled({post:this.post});
  $inElement.html(html);
};

module.exports = PostView;

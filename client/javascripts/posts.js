var endPoints = require('./blog-end-points');

var posts = {
  _posts : {},

  byId : function(postId) {
    var deferred = $.Deferred();
    if (this._posts[postId]) {
      deferred.resolve(this._posts[postId]);
    } else {
      endPoints.post(postId).then( function(post) {
        this._posts[postId] = post;
        deferred.resolve(post);
      }.bind(this)).fail( function(xhr) {
        deferred.reject(xhr.responseText);
      }.bind(this));
    }
    return deferred.promise();
  },

  fetch : function() {
    var deferred = $.Deferred();
    endPoints.posts().then( function(posts) {
      this._posts = posts;
      deferred.resolve(posts);
    }.bind(this)).fail( function(xhr) {
      deferred.reject(xhr.responseText);
    }.bind(this));
    return deferred.promise();
  }
};

module.exports = posts;

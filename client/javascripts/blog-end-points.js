blogEndPoints = {
  posts : function() {
    return $.get('/blog/articles');
  },

  post : function(postId) {
    return $.get('/blog/articles/' + postId);
  }
};

module.exports = blogEndPoints;

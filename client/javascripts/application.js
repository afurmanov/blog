var PageView = require('./page-view');

var application = {
  controller : null,


  start : function(router) {
    this.page = new PageView(application);
    router.go( window.location.pathname, true );
  },

  setController : function(controller) {
    if (this.controller !== controller ) {
      if (this.controller) {
        delete this.controller;
      }
      this.controller = controller;
      this.controllerLoad = this.controller.load();
      }
    return this.controllerLoad;
  }
};

module.exports = application;

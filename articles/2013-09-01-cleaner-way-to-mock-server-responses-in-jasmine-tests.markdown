author: Aleksandr Furmanov
title: Cleaner way to mock server responses in Jasmine tests
date: 09/01/2013

It is been a couple weeks since my last
[post](2013-08-20-testing-javascript-in-isolation-from-rails) where
I described how make Testem serve saved fixture files to emulate Rails
responses.  It appears there are better ways to mockup Ajax calls and
organize your JavaScript code.

### Quick reminder

Here is an contrived application from that last post:
```javascript
    var App = App || {};
    App.states = null;
    App.listStates = function() {
      $.getJSON( '/states' ).done( function(data) {
        App.states = data;
        var $popup = $("<select id='popup'></select>");
        App.states.forEach( function(state) {
          $popup.append('<option>' + state + '</value>');
        });
        $('body').append($popup);
        console.log($("#popup option").length);
      });
    }
```
It fetches list of states from the server and populates a *select*
element with items from that list. We want to be able to test this
tiny app without running a server. One way to accomplish this would be
to copy server responses and save them in files in test directory.  If
directory structured the same way as URLs then *Testem* would just
serve them. However there is a cleaner way:


### Promising about past

First, lets think a bit about what the code

```javascript
    $.getJSON( '/states' )
```

communicates to the reader. It specifies **how** to obtain list of
states, i.e. it says "go to that URL using GET method and obtain data
in JSON format". It feels like too much for application logic, does not
it? Would not it be nicer to replace it with somewhat like:

```javascript
    App.EndPoints.getStates()
```
Lets change our application code:


```javascript
    var App = App || {};
    App.states = null;

    App.EndPoints = {
      getStates : function() {
        return $.getJSON('/states');
      }
    };

    App.listStates = function() {
      App.EndPoints.getStates().done( function(data) {
        App.states = data;
        var $popup = $("<select id='popup'></select>");
        App.states.forEach( function(state) {
          $popup.append('<option>' + state + '</value>');
        });
        $('body').append($popup);
        console.log($("#popup option").length);
      });
    }
```

Our code becomes more abstract, instead of telling "Hey, send **GET**
request to **that URL** and retrieve **JSON** data", we just saying,
"Hey, get states", which is easier to
read. [Previously](2013-08-20-testing-javascript-in-isolation-from-rails)
we created a test:

```javascript
    // js_tests/test_index.js
    describe("states", function() {
      it ("fetches list of states from the server", function() {
          spyOn($, "ajax");
          App.listStates();
          expect($.ajax.mostRecentCall).toBeDefined();
          expect($.ajax.mostRecentCall.args[0].url).toEqual("/states");
      });
    });
```

which now could be now rewritten as:

```javascript
    // js_tests/test_index.js
    describe("states", function() {
      beforeEach( function() {
          spyOn(App.EndPoints, "getStates").andCallFake( function() {
            // return *something*
          });
      });

      it ("fetches list of states from the server", function() {
          App.listStates();
          expect(App.EndPoints.getStates).toHaveBeenCalled();
      });
    });
```

We replaced spy on *$.ajax* with spy on *App.EndPoints.getStates*
which technically is not the same, however meaning of our test did not change:

> "App.listStates() should fetch list of states from the server".

We are testing an application code in isolation from third-party services
(and treat our Rails app as one of such services). It is not a
significant difference where such isolation taking place - on
*jQuery* level or in our *App.EndPoints* wrapper. Theoretically we
could replace *jQuery* with some other library and our test still be
valid. However, what we should return as stubbed data in *andCallFake()*
callback?  It must be something having the same interface as what is
returned by *$.ajax()*. The
[jQuery documentation](http://api.jquery.com/jQuery.ajax/#jqXHR) says:

> The jqXHR objects returned by $.ajax() as of jQuery 1.5 implement
> the Promise interface

which means we have to return something which implements *Promise*
interface in our mock. Since *promise* is supposed to separate the
concerns of **resolving** from **observing resolution**, we could
fulfill it *before* or *after* observing begins. Which mean we could
return already fulfilled promise:


```javascript
    // js_tests/test_index.js
    describe("states", function() {
      beforeEach( function() {
          spyOn(App.EndPoints, "getStates").andCallFake( function() {
            var deferred = $.Deferred();
            deferred.resolve(['CA','IL','AL'])
            return deferred.promise();
          });

      });

      it ("fetches list of states from the server", function() {
          App.listStates();
          expect(App.EndPoints.getStates).toHaveBeenCalled();
      });
    });
```

### Killing two birds with one stone

Here is a copy of another test from
[previous post](2013-08-20-testing-javascript-in-isolation-from-rails):

```javascript
    describe("states", function() {
      it ("populate popup with states", function() {
        App.listStates();

        waitsFor( function(){
          return App.states !== null;
          }, 200, 'GET /states fails');

        runs( function(){
          expect($('#popup option').length).toEqual(3);
          });
      });

    });
```
As it mentioned earlier the *GET /states* is being served by Testem
since we placed *states* fixture file in tests directory. Lets
remove that file and allow test to fail:

    timeout: timed out after 200 msec waiting for GET /states fails

Now, in order to fix it we just have use our *beforeEach* state
preparation code:

```javascript
    describe("states", function() {
      beforeEach( function() {
        spyOn(App.EndPoints, "getStates").andCallFake( function() {
          var deferred = $.Deferred();
          deferred.resolve(['CA','IL','AL'])
          return deferred.promise();
        });

      });

      it ("populate popup with states", function() {
        App.listStates();

        waitsFor( function(){
          return App.states !== null;
          }, 200, 'GET /states fails');

        runs( function(){
          expect($('#popup option').length).toEqual(3);
          });
      });

    });
```

Test is green now! We should be able to reuse our test double and
share between different tests.

So, what are pros?

* We use mocks rather than fixture files which is a better
  practice, they local to test, and could be parameterized.

* No need to learn and use *jQuery/Jasmine* Ajax mocking libraries,
  such as [jasmine-ajax](https://github.com/pivotal/jasmine-ajax) or
  [jquery-mockjax](https://github.com/appendto/jquery-mockjax). No
  need to rely on Testem being a file server. Our tests are less
  dependent, which means we could easier change underlying
  technologies in the future.

* Our code is cleaner

Indeed,


> "We can solve any problem by introducing an extra level of
> indirection."

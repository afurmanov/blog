This is source code for my blog which is a Single Page App (SPA) and
Node.js based server.

Blog posts are _.markdown_ files in _./articles_ folder with couple additions to _.MARKDOWN_ syntax:

1. Footnotes syntax supported:

    <pre>
    [^1]
    [^1] Footnote 1
    </pre>

2. Post attributes could be specified as:
 
    <pre>
    Author: Mark Twain
    Title: Great Article
    Date: 09/28/2013

    Rest of .markdown here
    </pre>

See an online example at http://afurmanov.com

I wrote it to get a sense what is:

- Build a complete SPA not based on any framework (_Ember.js_,
_Backbone_, _Angular_, etc.). It still uses _MVC_ pattern to organize
client side logic.

- Create a Node.js application where dataflow is built around Promises

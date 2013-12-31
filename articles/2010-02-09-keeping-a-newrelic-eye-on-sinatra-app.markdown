title: Keeping a newrelic eye on Sinatra app
author: Aleksandr Furmanov
date: 02/09/2010

I've recently wanted to see what can I do about performance of my Sinatra app
and decided to spend some time playing with New Relic RPM tool. I've
found it useful although somewhat not exactly what I had been expected.


### Making it work
 First I've tried [instructions](http://support.newrelic.com/faqs/docs/210_beta)
, but they did not work for my Sinatra application. I've installed
gem, created newrelic.yml configuration file, made my app
instrumentable but I was not able to see anything on
[rpm.newrelic.com](rpm.newrelic.com). I had turned on debug logging - still
nothing, the newrelic_agent.log did not show anything interesting. However googling revealed
that *newrelic_rpm* gem does not send any
reports if application runs in *development* mode. I was running it in
production mode tough. After some investigation I had localized the
problem - I run my app as:
```ruby
RACK_ENV=production rackup my_app
```
and *newrelic_rpm* initialization code knows nothing about environment set
in this way, and by default it falls back to **development**. The patch is
straightforward:

```diff
    --- a/lib/newrelic_rpm.rb
    +++ b/lib/newrelic_rpm.rb
    @@ -40,6 +40,8 @@ elsif defined? Merb
           end
         end
       end
    +elsif defined? Rack && ENV['RACK_ENV']
    +  NewRelic::Control.instance.init_plugin(:env => ENV['RACK_ENV'])
     else
       NewRelic::Control.instance.init_plugin
     end
```

### Finding bottleneck
After playing with newrelic site I've found it is kind of cool and
helpful, I did some stresstesting of my app and got these numbers:

<pre>
    Memory usage: 170Mb
    Requests per second: 500
    Response time: 600ms
    CPU usage: 400%
</pre>

It is maximum CPU I could use on Linode 360, so I wanted to find a bottleneck
in my app. Actually many features are inaccessible in a free RPM Lite
service, however New Relic gives a one week free trial for Gold level
where one could find a better support for diagnostics. I still have a few days left.


### Profiling
I was under impression that I could use New Relic RPM as sort of rough
profiler. Indeed it works somewhat differently than I expected - it
allows me investigate only long (over 2secs) web transactions. I thought I
could change 2 seconds to something smaller, just to see details about my average
web requests, but was not able to find how to do this. Performance
reports gave my some useful info, particularly I knew how many
transactions were taking more than 2 second interval and I also was
able to see Performance Breakdown for them:
<table>
<tr><th>Slowest Components</th><th>Count</th><th>Exclusive	</th><th>Total</th></tr>
<tr><td>MySinatraApp</td><td>1</td><td>5,101ms</td><td>100%&nbsp;5,101ms&nbsp;100%</td>
</table>

Actually there aren't much details here. But it makes sense - *newrelic_rpm* does some
instrumentation, which means it monkey patches some methods to
collect statistics about their execution time. Since it cannot know
much about all application internals it tries to collect data about
components it knows:

- middlewares in Rack stack
- Action Controller methods in Rails
- Net::HTTP requests
- and bunch of others commonly used in Ruby applications

Since my application does not use much of them beside Rack middleware I could
not see much of details. But it appeared that it is possible to extend
what newrelic does trace, I'll show how below.

Even investigating on why long transactions are long could be helpful
I was looking for something different - I wanted to see a statistics
on average values, for example for particular URLs I wanted to see what
had been eating CPU time. Well, actually I could do this on developer
machine using a profiler, but it would be nice to see it in Relic
reports since instrumentation has already taken place.


### Gathering more details.
Actually it is pretty simple:
Given class *A* and method *#foo*:

```ruby
    class A
      include NewRelic::Agent::Instrumentation::ControllerInstrumentation
      def foo
      #...
      end
      add_transaction_tracer :foo
    end
```

Now information about *A::foo* is in reports.

### A bottom line
Actually I do not have a formed opinion yet. Seems like it is an excellent
tool for bird view over performance and it does not seem to shine
in more detailed investigations.

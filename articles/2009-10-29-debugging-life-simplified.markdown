title: Debugging life simplified
author: Aleksandr Furmanov
date: 10/29/2009


Some people say you can live without a debugger. May be, proper logging and and tests
definitely reduce number of times when you need to launch it, but I sometimes
find myself using debugger a lot, for example, when developing very new code.
One way how I design my classes is by writing a very limited number of test
cases and make them green – during such time I'm shaking up internal code
organization a lot and it does not make much sense to put it under extensive
tests. I feel like a painter creating a quick sketch. Painters create sketches
to quickly get an idea what works and what does not – before starting to work on big
 picture, so I am doing very similar thing except that code is somewhat more
precise than pencil - when code does not work  nothing could be said about it,
it just does not work. And to make it work I use debugger heavily on that stage.

  I am using *rdebug* and I find some annoyances:

* While localizing and fixing bug I place *debugger()* calls which I have to clean before I decide to
 run code in normal mode without debugger. Periodically I forget to clean them
 up and my tests fail when I expect them to pass. That could be easily fixed, by putting in test_helper.rb:

```ruby
unless Object.const_defined?(:Debugger)
  def debugger
    puts "debugger()..."
  end
end
```

This way I'm just observing on every test run that I forgot to delete some *debugger()*
 calls, and could postpone finding and deleting all of them until next commit to VCS.

* I use [blankslate](http://github.com/masover/blankslate) gem to have a class with almost no methods.
Such technique is described in Best Ruby Practices book by Gregory Brown as kind of
replacement of Ruby 1.9's *BasicObject*.  But it is hard to debug such class, the first error
 you are going get if you put *debugger()* call in some of its method will be:
*undefined local variable or method `debugger'*
You may unhide it:

```ruby
reveal(:debugger)
```

and immediately get another error while trying to inspect your objects: *#inspect, #to_s, #methods*, etc. are all hidden, and it
 is annoying to reveal them in debugger. So I decided to simplify my life a bit by making ancestor
class run–time dependant:

```ruby
Base = Class.new(Object.const_defined?(:Debugger) ? Object : BlankSlate) do
#...
end
```

  Yes, I risk to be caught by some method names conflict troubles, after all what was the reason to use BlankState? – so this is sort of compromise.

* While debugging I very frequently specify particular test I investigate, just to avoid unneeded breakpoints and to get faster to interesting moment. So, to say to <em>Test::Unit</em> that I am going to run some test <em>blabla</em> I need to separate <em>-n blabla</em> option by double dash <em> &#45;&#45;</em>, and that also annoys me, but just a little, so I have not tried to find a workaround yet.

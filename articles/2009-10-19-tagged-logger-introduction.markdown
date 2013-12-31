title: Tagged Logger Introduction
author: Aleksandr Furmanov
date: 10/19/2009


  If you want to log something then what do you do?
If you are writing Rails code the answer is obvious - *Rails#logger*, but if it is something
which could be potentially not a part of Rails application? Is that good to
use logger exposed by Rails for such component? Of cause not. But then what
logger should you use? You have number of options depending on your needs
– standard library *Logger*, *log4r* or something else. The obvious option is to
 initialize your component with some sort of logger, but if you really like logging (I do) and log a lot
then it could be somewhat annoying do it over and over. Surely the code is easy to understand when
you able to see all inputs and outputs in one place, but sometimes you just
 want to have something like *#logger()* method available from everywhere.

 Somebody could wonder – what's the problem? Just put *#logger()* in global namespace. Ok,
you did it, you use it every day, and now you have a bunch of information in
 your logs – from **everywhere**. Of cause you could regulate the amount and
importance of information you want to see in your logs by setting logging
level to *DEBUG, INFO, WARN, ERROR, FATAL* but you'll likely see a lot of non relevant
information. May be you want to have separate logging destinations depending on some
criteria – ORM operations and database queries in one place, requesting remote services in
other place, etc. The one way to do this is to use *log4r* – you may setup logger
hierarchy with it and specify output destinations for each logger within that hierarchy.
Your code is going to be somewhat like:

```ruby
Logger['ORM::database'].info(...)
```

Which means you have to organize your loggers into some hierarchy and name the place in
such hierarchy when you want to log something. But that's not nice – and there are at
least two reasons why:

* Code depends on *log4r* interface: *Logger#[]*, once you chose it you have to stick
with it, and it is not as short as *logger.info*
* You already have some components taxonomy: you have created class hierarchy, you
have been organizing directories in your project, you probably named classes in certain way, etc.
Why you need to keep one more taxonomy for logging rather than reusing one already exists?!

These two concerns triggered me to create [tagged_logger](http://github.com/afurmanov/tagged_logger):  logging is same as in Rails:

```ruby
logger.info('something')
```

but now it happens with **tag** underneath, and you may take an advantage of such tag, I'll show you how below.
At the moment tag is exactly class name from where *#logger()* gets called, but it also could be something
else in future, like caller source file name, depending on how [TaggedLogger](http://github.com/afurmanov/tagged_logger) has
been configured. Note that you do not have to specify tag explicitly, logger "figures it out" with some
metaprogramming magic. Here is how you can get tags printed in standard output:

```ruby
    TaggedLogger.rules do
      info /.*/ do |level, tag, message|
        puts "'#{level}' '#{tag}' '#{message}'"
      end
    end
    logger.info "global context" # -> 'info' 'Object' 'global context'
    class A; logger.info "in A context"; end # -> 'info' 'A' 'in A context'
```

Of cause instead of *puts* you may use any logger you like, you may also be more specific about what you want
to log. For example to limit logging only to classes which names ends on *Provider*:

```ruby
    providers_log = Logger.new(STDOUT)
    TaggedLogger.rules do
      debug /Provider$/, :to => providers_log
    end

    class Base; logger.debug('base'); end

    class NasdaqQuotesProvider
       def get;   logger.debug("quotes");  end
    end

    NasdaqQuotesProvider.new.get # will print 'quotes' and will not print 'base'
```

I use *tagged_logger*  gem to use logging as output in command line utility, guess how code for --debug option looks like? Yep, here it is:

```ruby
    debug_output = false
    standard_logger = Logger.new(STDOUT)
    OptionParser.new do |opts|
      opts.on("--debug", "Debug output") { debug_output = true }
    end.parse!
    TaggedLogger.rules do
      debug_output ?
        debug(/.*/, :to => standard_logger) :
        info(/.*/, :to => standard_logger)
    end

    def foo
      logger.info("starting foo operation...")
      logger.debug("details about foo operations...")
    end

    foo
```

No need to initialize my classes with particular logger, no fear I'm going to see something extra in output, in that case I always could
limit what goes to debug logging using tags.

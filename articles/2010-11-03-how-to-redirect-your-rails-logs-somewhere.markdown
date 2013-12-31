author: Aleksandr Furmanov
title: How to redirect your Rails logs somewhere
date: 03/11/2010

Sometimes you might want to have your logs at designated logging
service, like [logbook.me](http://logbook.me) or
[logworm.com](http://logworm.com), because for example, your
hosting environment is limited in keeping logs, like Heroku. At least
one solution you could try is a setting *config.logger*
for Rails application to your custom logger:

```ruby
    #lib/my_special_logger.rb
    class MySpecialLogger
      def info(message)
        LoggingService.info(message)
      end
    end

    #config/application.rb
    config.logger = MySpecialLogger.new
```
The *LoggingService* above is some imaginary interface to some external
service. It is all great, however frequently enough you want to watch for
**special** kind of events like exceptions or access to some
URLs or communication with external API etc. In other
words you either want to have a separate log for these events or to
have an ability to filter your log by certain criteria. For
example, the [logbook.me](http://logbook.me) has a feature such as *facility*,
i.e. you could create categories for your entries. To log something
to [logbook.me](http://logbook.me) you have to install a gem
[logbook_gem](https://github.com/logbook/logbook_gem) and execute:

```ruby
    Logbook.debug 'facility', {:message => "some important message"}
```

Later you may filter by that 'facility' using web interface. This could
be convenient for analyzing entries you are interested in. Unfortunately
you cannot take an advantage of this feature by replacing
*Rails.logger* with your custom logger, simply because the standard logger
interface is different and the only way to manage granularity of what
goes into your logs is to use severity: - DEBUG, INFO, WARN, ERROR,
FATAL or UNKNOWN. However you are not out of luck here, you may use the
[tagged_logger](http://github.com/afurmanov/tagged_logger) gem to add
 categorization to your entries **without** modifying your code, so
whenever you have a call:

```ruby
    logger.info "something..."
```

the logger capture a context where it is being called from and you
could use this context as a category. The context is the class
whose method does such call. For example to create a
special category for *MyController* one could write:

```ruby
    #my_controller.rb
    class MyController
      def index
         logger.info "very important operation! :)"
      end
    end

    #config/initializers/tagged_logger.rb
    TaggedLogger.rules do
      #rule with regular expression:
      info /MyController/ do |level, tag, msg|
        Logbook.info(tag, :msg => msg)
      end
    end
```

You may have various rules for different models or controllers or
any other classes, you may also combine them in groups and assign
special tag for that group. The DSL provided by [tagged_logger](http://github.com/afurmanov/tagged_logger) gem is
very flexible about how you could define your rules. Now imagine you
want to redirect logging from *ActionController::Base*:

```ruby
    TaggedLogger.rules do
      #rule with class name:
      info ActionController::Base do |level, tag, msg|
        Logbook.info(tag, :msg => msg)
      end
    end
```

If you expect to see your regular Rails log entries get redirected you
would be disappointed. The reason is that logging inside Rails 3 is
mostly done via *instrumentation* mechanism, here is a demonstrating
snippet:

```ruby
    module ActionController
      module Instrumentation
        def send_data(data, options = {})
          ActiveSupport::Notifications.instrument("send_data.action_controller", options) do
            super
          end
        end
      end
      class Base < Metal
        include Instrumentation
      end
      class LogSubscriber < ActiveSupport::LogSubscriber
        def send_data(event)
          logger.info("Sent data %s (%.1fms)" % [event.payload[:filename], event.duration])
        end
      end
    end
```

The *Notifications.instrument* method signals an event to
*ActionController::LogSubscriber* which in turn 'translate' the event
into *LogSubscriber.send_data* call and logs it. Therefore the context
where *#logger* call is made is *ActionController::LogSubscriber*, so rule for
*ActionController::Base* would not be triggered. Luckily the
[tagged_logger](http://github.com/afurmanov/tagged_logger) is aware
about these details in Rails 3, and it gives an
option to create such rules by using a few predefined tags:

```ruby
    #config/initializers/tagged_logger.rb
    TaggedLogger.rules do
      debug /actioncontroller.logsubscriber$/ do |level, tag, msg|
        Logbook.send(level, tag.to_s, :msg => msg )
      end
    end
```

You may also use *active_record.logsubscriber*,
*action_mailer.logsubscriber*, *action_view.logsubscriber* and
*rack.logsubscriber* tags or if you want to redirect **all** Rails
logging:

```ruby
    debug /\.logsubscriber$/ do |level, tag, msg|
        Logbook.send(level, tag.to_s, :msg => msg )
    end
```

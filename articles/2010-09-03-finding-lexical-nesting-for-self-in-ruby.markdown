author: Aleksandr Furmanov
title: Finding lexical nesting for self in Ruby
date: 03/09/2010

While I have been working on code communicating with Google Data API I found
that it would be very convenient to enclose components specific to particular
Google service under same namespace, particularly because they could
share common constants defined in that namespace.
Since these components have many things in common I imlemented them as
a Template Method, i.e. there is common implementation in base classes
and derived classes supposed to customize it by fullfilling obligations imposed by it.
Here is the short snapshot:

```ruby
    module Base
      class Service
        def atom_header
          header["GData-Version"] = API_VERSION
        end
      end
    end

    module Contacts
      API_VERSION = "1.0"
      class Service < Base::Service
      end
    end
```

Here the *Base::Service* relies on constant *API_VERSION* accessible
within derived class. However code above would not work, because
Ruby rules for constant lookup are:

 - Check lexical scope
 - Check included modules
 - Check superclass
 - call *#const_missing*

Neither of them give us *API_VERSION*. One way to solve it would be to
access *API_VERSION* via current class, i.e. via *self.class*:


```ruby
    module Base
      class Service
        def atom_header
          header["GData-Version"] = self.class::API_VERSION
        end
      end
    end
```

But to make it work we have to move *Contacts::API_VERSION* to the
*Contacts::Service::API_VERSION*, i.e:

```ruby
    module Contacts
      class Service < Base::Service
         API_VERSION = "1.0"
      end
    end
```

Which might be Ok but as soon we have to access *API_VERSION* from, say,
*Base::Entry* we have to define it in *Contacts::Entry* in similar
manner, and that sort of duplication is better to be avoided.
What we really want to do is to ask *self.class* - "Hey, what is your
lexical scope?". Ruby has method for getting lexical scope -
*Module#nesting*:


```ruby
    module Base
      class Service
        def atom_header
          Module.nesting # - > [Base::Service, Base]
        end
      end
    end
```

Unfortunately there is not much help we could get from *Module#nesting*,
because it gives us a lexical context of **point of call**, when we need a
lexical context for *self.class*. It seems like an easiest solution
would be just to parse *self.class.name* and find out a lexical context
from there. That is what essencially the mini-gem [namespaces](http://github.com/afurmanov/namespaces) does:


```ruby
    require 'namespaces'

    module Base
      class Service
        include Namespaces
        def atom_header
          header["GData-Version"] = namespaces.first::API_VERSION
        end
      end
    end


    module Contacts
      class Service < Base::Service
         API_VERSION = "1.0"
      end
    end
```

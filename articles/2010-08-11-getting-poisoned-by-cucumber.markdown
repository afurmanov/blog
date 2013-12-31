title: Getting poisoned by Cucumber
author: Aleksandr Furmanov
date: 08/11/2010

  Recently I've been working on quite large system implemented in
Rails. Virtually every feature or requirement has an acceptance
Cucumber test which is kind of great, 'cause it gives a sense of
confidence the things are not really broken. To me, the main point of
using Cucumber is having tests and business model description in a one
single piece. The niceties are:

 1. ground for putting down requirements while communicating with
stakeholders, since they are not necessary programmers to write/read
requirements in Ruby.
 2. source of knowledge for people who are not necessary domain
experts, like new team members.

Those were at least my expectations before I joined to that
 complex project. However real life is a kind of more complicated, and
 these niceties do not work the way as for my previous smaller
 projects, which made me thinking about why and what is going
 differently. I also noticed that writing Cukes sometimes is
hard and takes significantly more time than writing feature itself. I
am not trying to say the Cucumber is a bad tool, it is great tool, I do not have
problems with it on smaller projects. May be it is not right tool for
 complex projects or may be it is my lack of knowledge how to use
it for complex projects. To describe a problem I'd
like to show a demonstrating example:


> The City Department of Recreation wants to seed more gardens around
> the city, so it runs a program where applicants could apply for a
> Grants and get funding if Department finds their gardening projects
> as most interesting. There are gardening policies, among other things
> they specify what plants species could be used in city gardens. Every
> project has an associated account for expenses tracking. The
> plants are being kept and maintained in special building, where they
> initially get delivered to from various plant vendors and where staff
> keeps plants alive by providing appropriate care. The app users want to
> track what happens to plants, where they
> are located, to what project they belongs to. For that
> purpose the Department requests a web page where all type of plant
> transitions could be recorded including transitions to new project
> (by specifying project's account number) as well transitions to new
> location. If transition happens with some exotic plants the garden
> project managers have to be notified via email.

Here is a Cuke:
<pre>
    Feature: email on_moving_exotic_plants
      In order to be aware on what happens with exotic and usually expensive plants
      As a Garden Project Manager
      I want to get notified about everything what happens with that plants

      Scenario: Exotic Plant being moved from one room to another
        Given there is an exotic plant in the storage
        And staff moves it from one room to another
        Then Garden Project Manger who needs that exotic plant opens an email
          And she must see the reason for transitioning the plant
          And she must see link to original order for that  plant
</pre>

Simple enough, isn't it? So developer writes steps for that scenario and makes it green.
As time goes by the other features get requested and implemented, like getting reports
about plants inventory, monthly billing reports, you've got an
idea. More and more scenarios as above appear and many
steps look very similar, and since nobody like to
repeat himself the similar steps get refactored to reusable steps, so
they could be shared across scenarios. The more
scenarios the more reusable steps. The more reusable steps the more
primitive they are. So after a number of iterations the scenario above
looks like this:

<pre>
    Scenario: Exotic Plant being moved from one room to another
    Given I am logged in as a Staff
      And there are projects:
      | Name              | Manager    | State    |
      | The Exotic Garden | Lili White | Approved |
      And there are accounts:
      | Owner      | Number |
      | Lili White | 777    |
      And storage has rooms:
      | Room name  |
      | Sunny Hall |
      | Dark Hall  |
      And order 1 is received:
      | Species | Project           | ToRoom     | Quantity |
      | Exotic  | The Exotic Garden | Sunny Hall |       10 |
    When I go to "Plants Transitions" page
      And I fill in "From Account" with 777
      And I fill in "To Account" with 777
      And I fill in "From Room" with "Sunny Hall"
      And I fill in "To Room" with "Dark Hall"
      And I fill in "Species" with "Exotic"
      And I fill in "Quantity" with 1
      And I fill in "Reason" with "Exotic likes dark"
      And I press "Do!"
    Then "Lili White" opens an email
      And she must see "Too much light"
      And she must see link to the order 1
</pre>

Oh, wait, there some non mentioned chunks of information appears here,
first scenario version does not say anything about *accounts*, or that
project has *approved* state. Where these came from? The reason they
showed up is simple - general
steps could not assume details, they have to accept them as
parameters, otherwise it would be hard to reuse them across scenarios and they
would be too specific to be called general.
For example, step responsible for creating a project cannot make
assumptions about project state because for one scenario we need an
*approved* project and for another we need a *rejected* project. So we
have to pass that state from outside. The same with accounts, instead
of:

<pre>
    And staff moves it(plant) from one room to another
</pre>

We have:
<pre>
    When I go to "Plants Transitions" page
      And I fill in "From Account" with 777
      And I fill in "To Account" with 777
      And I fill in "From Room" with "Sunny Hall"
      And I fill in "To Room" with "Dark Hall"
      And I fill in "Species" with "Exotic"
      And I fill in "Reason" with "Exotic likes dark"
      And I fill in "Quantity" with 1
      And I press "Do!"
</pre>

 Why do we have
*accounts* mentioned here? Because that is how page is designed and we
have to specify the account number fields have same values. We do not care
about what these values are while they are same. But we cannot
expect a step:

<pre>
    And I fill in "From Account" with 777
</pre>

be smart enough to create an account for us. It is too much
responsibility for that step. So we keep using generated web steps
and we specify the account number explicitly, but to specify it
explicitly we  have to have a step mentioning that account number:

<pre>
      And there are accounts:
      | Owner      | Number |
      | Lili White | 777    |
</pre>

instead of relying on factories to generate it for us.
That is how extra details sneak in our scenarios.


We have reduced the overall number of
steps by making them reusable, however what price did we pay? The
scenarios became longer. How much longer?
Well, here, in this example the second scenario is 4 times longer than first
one. It is much less readable, it brings extra pieces of informations
for sake of being DRY, and when scenarios start growing in
two screens monsters I really start being unsure about I am doing the right
things. Ok, steps are DRY, but is it helpful? Are
stakeholder able to read and understand scenarios? No. Does it helps programmers to
understand business domain? No. It looks like a program and for what
looks like a program there is Ruby or other programming language.

There is a way to address the problem, at least to try - by
expressing complex Cucumber steps via primitive ones:

<pre>
    And /^staff moves plants from one room to another$/ do
      And %{I go to "Plants Transitions" page}
      And %{I fill in "From Account" with #{@plant.project.account.number}}
      And %{I fill in "To Account" with #{@plant.project.account.number}}
      And %{I fill in "From Room" with #{@plant.where}}
      another_room = Factory(:Room)
      And %{I fill in "To Room" with #{another_room.name}}
      And %{I fill in "Species" with #{@plant.species.name}}
      And %{I fill in "Quantity" with 1}
      And %{I fill in "Reason" with "Exotic likes dark"}
      And %{I press "Do!"}
    end
</pre>

It could make scenarios much more readable, however there are couple
issues with such approach:

 * The first one, if take a look at the code, the *@plant* has to be created somewhere at the
earlier steps, plus it has to be assigned to some project with
account. It is bunch of assumptions involved which is not good,
since it creates implicit dependencies between steps.
 * Before speaking about second one, lets get into the shoes of developer who
needs to write step:

<pre>
    /^Somebody moves plants from one account to another$/
</pre>

That step is going to look very close to the previous one where we move plant between rooms, so instead of
writing a new step she could refactor the one already exists:

<pre>
    And /^(.) moves plants from one (.*) to another$/ do |who, place|
      And %{I go to "Plants Transitions" page}
      And %{I fill in "From Account" with #{@plant.project.account.number}}
      account = "account" == place ? Factory(:Account) : @plant.project.account
      And %{I fill in "To Account" with #{account.number}}
      And %{I fill in "From Room" with #{@plant.where} }
      another_room = "room" == place ? Factory(:Room) : @plant.room
      And %{I fill in "To Room" with #{room.name} }
      And %{I fill in "Species" with #{@plant.species.name}}
      And %{I fill in "Quantity" with 1}
      And %{I fill in "Reason" with "There is always a reason"}
      And %{I press "Do!"}
    end
</pre>

A few small refactoring like this - and we could end up with very complex
step. Complex but DRY! Well, DRYness means it is shared, and having a
complex steps shared between scenarios is not good idea. Why? Because
when somebody changes it the chances are high the other scenarios get broken
and such steps becomes behaving like a fragile fixtures. Touch
something and bunch of tests start to fail. Frankly, I do not think
that it is Cucumber' problems, however I think the Cucumber is not right
tool for writing complex scenarios. When we need to describe a complex
scenarios in Cucumber we either have to have complex steps separated from
scenarios into different step files and have them written in procedure style or we
have bunch of trivial steps without being able to clearly see the forest for the trees.

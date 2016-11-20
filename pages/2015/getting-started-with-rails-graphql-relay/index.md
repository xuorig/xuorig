---
title:  "Getting started with Rails and GraphQL"
date:   2015-11-11 11:00:00
description: How to get started with a Rails GraphQL API
---

For the past few weeks I've been playing with Facebook's [GraphQL][GraphQL] and [Relay][relay] for a personal project of mine. I thought I would give a quick overview of how to set up a Relay App using Rails as the API.

# What is [GraphQL][GraphQL] ?
Simply put, GraphQL is an application layer query language from Facebook. You can describe your API using a schema (a graph). All your clients can then query your data through the schema. GraphQL tries to solve one of the biggest problems we have with REST APIs these days: Changing data requirements in the clients.

Here's what a GraphQL Query would look like:
```javascript
{
  user(id: 1) {
    id,
    name,
    friends {
      name
    }
  }
}
```

The GraphQL response to this query would look like this:
```javascript
{
  "user" : {
    "id": 1,
    "name": "Marc-Andre Giroux",
    "friends": [
      {
        "name": "Joe Bro"
      },
      {
        "name": "Johny Yolo"
      }
    ]
  }
}
```

Now imagine we want to fetch the friends profile pictures, interests, and any other data. In we were using REST, we would either hit many other endpoints, or have to create a custom end point to fetch all that data at once.

With GraphQL, we only add what we want to the query and it will fetch it, just like this:

```javascript
{
  user(id: 1) {
    id,
    name,
    friends {
      name
      interests {
        name
      }
      profilePicture {
        url,
        width,
        height
      }
    }
  }
}
```

Check out the [Graphql Repo][GraphQLrepo] for more information about GraphQL: How to query, mutate the schema and the type system.

# Building a Rails GraphQL API

In this tutorial we're gonna build a simple Blogging app where you can fetch blogs and authors.

Lets start by building the API. Although it's possible to have both the relay app and the API live in a single Rails app, I chose to implement it as 2 different parts. Since the requests will be coming from a different origin than the API, we need to setup CORS. Lets use [rack-cors][rackcors] to do that.

First, add `rack-cors` to your `Gemfile`.
```ruby
  gem 'rack-cors', :require => 'rack/cors'
```

Add this code in `config/application`
```ruby
module MyBlogApp
  class Application < Rails::Application

    # ...

    config.middleware.insert_before 0, "Rack::Cors" do
      allow do
        origins '*'
        resource '*', :headers => :any, :methods => [:get, :post, :options]
      end
    end

  end
end
```

Obviously, don't actually use these settings in production, you will want to chose the allowed origins carefuly.

Next, we're gonna need some models for our Blog App. Lets create a Blog and an Author model

Run:
```ruby
rails generate model Blog title:string content:string author_id:integer
```

```ruby
rails generate model Author name:string
```

Our blog has one author so lets add that association to the model:
```ruby
class Blog < ActiveRecord::Base
  belongs_to :author
end
```

and to the Author model:
```ruby
class Blog < ActiveRecord::Base
  belongs_to :author
end
```

Alright. It's time to bring GraphQL in. We're going to be using [rmosolgo's][rmo] [GraphQL-ruby][graphruby] which is an amazing gem to build our GraphQL Schema. Add the gem to your Gemfile.

```ruby
gem 'GraphQL'
```

Time to build our GraphQL Schema. Create a new folder in your app folder, `app/graph`. Everything GraphQL related will live there.

In that folder, create `app/graph/types`, where our custom GraphQL types will be created.

Make sure you add this line to your `application.rb` for rails to autoload the types:

```ruby
config.autoload_paths << Rails.root.join('app', 'graph')
config.autoload_paths << Rails.root.join('app', 'graph', 'types')
```

As a first type, let's create the `Query` type. GraphQL always needs a query root for a schema. Create `query_type.rb` in `app/graph/types` and add the following code in it.

```ruby
# app/graph/types/query_type.rb
QueryType = GraphQL::ObjectType.define do
  name "Query"
  description "The query root for this schema"

  field :blog do
    type BlogType
    argument :id, !types.ID
    resolve -> (obj, args, ctx) {
      Blog.find(args[:id])
    }
  end
end
```

When declaring a type using the `GraphQL` gem, we have a few things to do. First we name the type (Query in that case). A small description is also needed for schema introspection. We declare fields on that type using the field method. Here we are using a block to define that field. We set the type for the `blog` field to BlogType and also give a resolve proc, which will be called when GraphQL wants to resolve that field. The proc takes 3 arguments, the obj (The query in that case), args which you will be able to pass in when you query, and context, a dict where you can pass any variables you might want to use on resolve time.

So, at the query root, we declare a field blog. which will return a blog by id. Let's add also the `BlogType` and the `AuthorType`

```ruby
# app/graph/types/blog_type.rb
BlogType = GraphQL::ObjectType.define do
  name "Blog"
  description "A Blog"
  field :title, types.String
  field :content, types.String
  field :author do
    type AuthorType
    resolve -> (obj, args, ctx) {
      obj.author
    }
  end
end
```


```ruby
# app/graph/types/author_type.rb
AuthorType = GraphQL::ObjectType.define do
  name "Author"
  description "Author of Blogs"
  field :name, types.String
end
```

Let's create the GraphQL Schema with our newly created types, at the root level of your graph folder, create this file:

```ruby
# app/graph/blog_schema.rb
BlogSchema = GraphQL::Schema.define do
  query QueryType
end
```

The only thing left now is exposing that Schema through an end point. The best way to do that is to handle POST requests with a GraphQL query as the data.

Since we're building an API, make sure your `ApplicationController` has this line:

```ruby
class ApplicationController < ActionController::Base
  # Use :null_session here
  protect_from_forgery with: :null_session
end
```

Now lets create `QueriesController` which will handle these POST requests.

```ruby
class QueriesController < ApplicationController
  def create
    query_string = params[:query]
    query_variables = params[:variables] || {}
    result = BlogSchema.execute(query_string, variables: query_variables)
    render json: result
  end
end
```

And let's not forget to add a route to that controller:

```ruby
resources :queries, via: [:post, :options]
```


Time to test now! Add some mock data to your db and run queries using curl for now:

Query:
```bash
curl -XPOST -d 'query={ blog(id: 1) { title content }}' http://localhost:3000/queries
```

Response:
```bash
{"data":{"blog":{"title":"Intro to GraphQL","content":"Something something something. Blah blah blah. Etc etc etc."}}}
```


What if we wanted the author in the response ? Simply add it to the the query!

Query:
```bash
curl -XPOST -d 'query={ blog(id: 1) { title content author { name } }}' http://localhost:3000/queries
```

Response:
```bash
{"data":{"blog":{"title":"Intro to GraphQL","content":"Something something something. Blah blah blah. Etc etc etc.","author":{"name":"Marc-Andre Giroux"}}}}%
```

And that's it! We got a working GraphQL API using Ruby on Rails. __Stay tuned for the next part__ where we will build an app using React/Relay using the API we just built.

You can take a look at the [source here][src].

#### If you have more questions about GraphQL, come hang out in Slack! [https://GraphQL-slack.herokuapp.com/][slack]

#### Edit:
As Sergio del Rio pointed out in comments, you'll want to change `protect_from_forgery` to `null_session`
in your `ApplicationController` for your api to work correctly at first. Also make sure you name your files the same as your class name for Rails to load them correctly. `QueryType` -> `query_type.rb`

#### Edit2:
Instead of using curl to test your queries, you can use GraphiQL, an amazing tool to test and even autocomplete your GraphQL queries. [Here's how to install it in your Rails App.][install]

You can find me on Twitter [@\_\_xuorig\_\_][twit] or [Github][xuo]

[twit]: https://twitter.com/__xuorig__
[xuo]: http://github.com/xuorig
[app]: https://github.com/xuorig/my-simple-blogging-app
[GraphQL]: http://facebook.github.io/GraphQL/
[relay]: https://github.com/facebook/relay
[graphruby]: https://github.com/rmosolgo/GraphQL-ruby
[rmo]: https://github.com/rmosolgo
[GraphQLrepo]: https://github.com/facebook/GraphQL
[react]: https://facebook.github.io/react/
[containers]: https://facebook.github.io/relay/docs/guides-containers.html
[rootcontainer]: https://facebook.github.io/relay/docs/guides-root-container.html#content
[relaydocs]: https://github.com/facebook/relay
[install]: http://mgiroux.me/2016/setting-up-graphiql-with-rails/
[rackcors]: https://github.com/cyu/rack-cors
[slack]: https://GraphQL-slack.herokuapp.com/
[src]: https://github.com/xuorig/my-simple-blogging-app
[https://facebook.github.io/react/]: https://facebook.github.io/react/

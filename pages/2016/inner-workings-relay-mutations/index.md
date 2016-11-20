---
title:  "The Inner Workings of Relay Mutations (part 1)"
date:   2016-11-20 10:00:00
description: How relay interprets your fatQuery and configurations
---

In the past few months I've contributed a few things to Relay. Most of these things were related to mutations, which really helped me understand what happens under the hood when we execute mutations from Relay.

Relay mutations are often the source of some confusion, especially with all the mutation configs we must choose from. I've written about how [Relay executes read queries][read] before and how to [understand range behaviours][range], but this time we'll see what happens when we execute a Relay mutation from start to end!

# The API

Relay Mutations are defined by extending the `Relay.Mutation` base type. We declare
a class that defines... a *lot* of things ;)

```javascript
class AddItemMutation extends Relay.Mutation {
  // Our getMutation function should return a GraphQL query
  // that contains our mutation operation. In our case we're interested
  // with the addItem mutation.
  getMutation() {
    return Relay.QL`mutation {addItem}`;
  }

  // getVariables is straightforward. It should return any variables our mutation
  // might need.
  getVariables() {
    return {item: this.props.item};
  }

  // the getFatQuery function is the tricky one. A "fat query" is a GraphQL like
  // query that represents every field in your data model that could change as
  // a result of a mutation.
  // For example, when we add an item, our `collection` should change.
  getFatQuery() {
    return Relay.QL`
      fragment on AddItemPayload {
        collection { item }
        newItemEdge
      }
    `;
  }

  // The getConfigs method should return an array of config objects. These
  // config objects instruct how Relay should react to our newItemEdge
  // after the mutation has been done.
  getConfigs() {
    return [{
      type: 'RANGE_ADD',
      parentName: 'parent',
      parentID: this.props.parent.id,
      connectionName: 'collection',
      edgeName: 'newItemEdge',
      rangeBehaviors: {
        // When the collection connection is not under the influence
        // of any call, append the ship to the end of the connection
        '': 'append',
        // Prepend the edge, wherever the connection is sorted by most recent
        'orderby(newest)': 'prepend',
      },
    }];
  }
}
```

To execute such mutations, we usually use the `relay.commitUpdate` function. In our case, the code
would look like this:

```javascript
onItemAdd = (item) => {
  // To perform a mutation, pass an instance of one to
  // `this.props.relay.commitUpdate`
  this.props.relay.commitUpdate(
    new AddItemMutation({item})
  );
}
```

Ok, now that we know the API, it's time to dig into what happens when we call that `commitUpdate` function. Make sure to check out the [Relay Mutation Docs][relaydocs] if you're confused, or not familiar with Relay Mutations!

# Mutation Transactions

The first step in executing a mutation for Relay is to create a Transaction object and enqueue it in the `RelayMutationQueue`. The `RelayMutationQueue` is an object used coordinate all mutations in your app. It will take care of optimistic payloads, rollbacking those when the server response is different, and even manage collision keys (Mutations with the same collision should be ran serially).

## Creating a transaction

What `commitUpdate` does is exactly that.

  - It will first create a `RelayPendingTransaction` using the mutation object we passed to it.
  - It will keep track of the pending mutation with a `_pendingTransactionMap` cache on the `RelayMutationQueue`.
  - It will add the pending transaction to the `_queue`

Notice that `commitUpdate` can take an `onSuccess` and `onFailure` callback. These callbacks are attached
to the pending transaction.

Relay will then try to apply the optimistic change to it's internal store, before even sending the
mutation to the GraphQL server. Using the transaction id (the famous `clientMutationID`), it will retrieve the transaction from the queue and call `_handleOptimisticUpdate`. This will do a few things:

  - get the optimistic response from the transaction by calling `transaction.getOptimisticResponse()`
  - get the optimistic query (fake GraphQL query basically)  by calling `transaction.getOptimisticQuery()`
  - Update the store as if we received a response from the GraphQL server using the query and the response. (We'll see how that works in detail later on)

*Note: If we had used `applyUpdate` instead of `commitUpdate` here, our job would be done. `applyUpdate` is used to create a transaction, but not doing anything with it yet. [I've written about it before.][apply]*

OK. Now that the transaction is queued and our optimistic update was successful, we would like to execute that mutation! `commitUpdate`, as you might've guessed, will then call `commit` on the transaction.

## Committing the transaction

When committing a transaction, the first thing Relay checks for is collisions. Collision keys can be used to tell Relay not to commit two conflicting transactions concurrently. So every time we commit a transaction, Relay will check in a special `collisionQueue` to check if we have something for that key queued up already. If it does not we can go ahead and commit!

```javascript
const request = new RelayMutationRequest(
  transaction.getQuery(this._storeData),
  transaction.getFiles(),
);
this._storeData.getNetworkLayer().sendMutation(request);
```

Relay will create a new object `RelayMutationRequest`. `RelayMutationRequest` is used
by the network layer to send the mutation to our server. It actually extends `Deferred` and is used
like one.

The really important line here though is `transaction.getQuery(this._storeData)`. Our RelayMutationRequest takes a `RelayQuery.Mutation` object as it's first parameter.

`transaction.getQuery` builds a `RelayQuery.Mutation` object:


```javascript
RelayMutationQuery.buildQuery({
  configs: this.getConfigs(),
  fatQuery: this.getFatQuery(),
  input: this.getInputVariable(),
  mutationName: this.getMutationNode().name,
  mutation: this.getMutationNode(),
  tracker,
});

// => Returns a RelayQuery.Mutation
```

A `RelayQuery.Mutation` object is basically an in memory representation of the `GraphQL` query that will be sent to the server. It supports a bunch of operations, but mainly we will use it to print our final GraphQL Query.

# Building the final mutation query

The hard part here is building that object. Relay needs to build the correct fragments for you. These fragments depend on many things such as:

  - The FatQuery you defined
  - The configs you defined (RANGE_ADD, FIELDS_CHANGE, etc...)
  - The Query Tracker
  - Variables

`RelayMutationQuery.buildQuery` is used to build those final fragments and finally build our `RelayQuery.Mutation` object.

So `buildQuery` goes through every config you have defined in your mutation object. For every config it will create a fragment using the corresponding function:

  - `RANGE_ADD` => `RelayMutationQuery.buildFragmentForEdgeInsertion`
  - `RANGE_DELETE` => `RelayMutationQuery.buildFragmentForEdgeDeletion`
  - `FIELDS_CHANGE` => `RelayMutationQuery.buildFragmentForFields`
  - ...

Each of these functions behave differently but let's take for example `buildFragmentForEdgeInsertion` which creates a fragment used to fetch data necessary to insert a new edge into an existing connection.

First, it will use the `tracker` to check if our application is actually using the connection we're appending to. There's no need to fetch extra data that we won't use right ? Then since we're doing a `RANGE_ADD` mutation, we'll build the `newEdgeField`, which your server should be returning! Finally, we'll use the `fatQuery` and the tracker to see what we should refetch.

Relay will intersect your `fatQuery` and the `trackedQuery` for the parent node. That means that even if you add an enormous amount of fields in your `fatQuery`, if you current view doesn't actually show these fields (they're not tracked), Relay will not include these in the mutation fragment. This is done using the `intersectRelayQuery` function.

All the nodes we are building are pushed into a fields array, that will be used to create our fragment object:

```javascript
const fragment = RelayQuery.Fragment.build(
  'MutationQuery',
  fatQuery.getType(),
  fields
);
```

When all the needed fragments are created (maybe you had many configurations), we're ready to create the final `RelayQuery.Mutation` object.

```javascript
return RelayQuery.Mutation.build(
  ...lotsOfStuff,
  fragments
);
```

# Sending it through the wire

The `RelayMutationRequest` we created with our `RelayQuery.Mutation` object is now ready to be sent.

```javascript
getNetworkLayer().sendMutation(request)
```

The `NetworkLayer` here can be the `DefaultNetworkLayer` that Relay Provides, but is also often a custom class in user land. That class should respond to `sendMutation`, which will receive the request.

Finally, we can then use the multiple functions on the request object to send our payload to the server:

```javascript
function sendMutation(request) {
  fetch(this._uri, {
    body: JSON.stringify({
      query: request.getQueryString(),
      variables: request.getVariables(),
    }),
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
}
```

So this was a high level overview of what happens when you execute a Mutation in Relay! I believe understanding what happens under the hood makes it easier to debug your mutations as it's not always straight forward :).

There's a lot of other interesting things happening when we receive the response from the server, but I'll keep that for part 2.

This blog was based on what is at this time the latest master. Which you can find here https://github.com/facebook/relay/tree/beb150b86f1e0e4a2c22e8e20fb52003ed344196.

Let me know if you have any questions! And as always you can find me on Twitter [@\_\_xuorig\_\_][twit] or [Github][xuo]!

[globalid]: https://github.com/rails/globalid
[twit]: https://twitter.com/__xuorig__
[xuo]: http://github.com/xuorig
[relaydocs]: https://facebook.github.io/relay/docs/guides-mutations.html#content
[read]: http://mgiroux.me/2016/quick-dive-into-relay-query-fetching/
[range]: http://mgiroux.me/2016/the-mysterious-relay-range-behaviours/
[apply]: http://mgiroux.me/2016/relays-apply-update-function/

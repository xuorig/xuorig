---
title:  "The inner workings of Relay Mutations"
date:   2016-11-19 10:00:00
description: or how to understand Relay mutations transactions and configurations
---

In the past few months I've contributed a few things to Relay. Most of these things were related to mutations, which really helped me understand what happens under the hood when we execute mutations from Relay.

Relay mutations are often the source of some confusion, especially with all the mutation configs we must choose from. I've written about how [Relay executes read queries][read] before and how to [understand range behaviours][range], but this time we'll see what happens when we execute a Relay mutation from start to end!

# The API

Relay Mutations are defined by extending the `Relay.Mutation` base type. We declare
a class that defines... a *lot* of things ;)

```javascript
class AddProductMutation extends Relay.Mutation {
  // Our getMutation function should return a GraphQL query
  // that contains our mutation operation. In our case we're interested
  // with the addProduct mutation.
  getMutation() {
    return Relay.QL`mutation {addProduct}`;
  }

  // getVariables is straightforward. It should return any variables our mutation
  // might need.
  getVariables() {
    return {product: this.props.product};
  }

  // the getFatQuery function is the tricky one. A "fat query" is a GraphQL like
  // query that represents every field in your data model that could change as
  // a result of a mutation.
  // For example, when we add a product, our `products` should change.
  getFatQuery() {
    return Relay.QL`
      fragment on AddProductPayload {
        shop { products }
        newProductEdge
      }
    `;
  }

  // The getConfigs method should return an array of config objects. These
  // config objects instruct how Relay should react to our AddProductPayload
  // after the mutation has been done.
  getConfigs() {
    return [{
      type: 'RANGE_ADD',
      parentName: 'shop',
      parentID: this.props.shop.id,
      connectionName: 'products',
      edgeName: 'newProductEdge',
      rangeBehaviors: {
        // When the products connection is not under the influence
        // of any call, append the ship to the end of the connection
        '': 'append',
        // Prepend the product, wherever the connection is sorted by most recent
        'orderby(newest)': 'prepend',
      },
    }];
  }
}
```

To execute such mutations, we usually use the `relay.commitUpdate` function. In our case, the code
would look like this:

```javascript
onProductAdd = (product) => {
  // To perform a mutation, pass an instance of one to
  // `this.props.relay.commitUpdate`
  this.props.relay.commitUpdate(
    new AddProductMutation({product})
  );
}
```

Ok, now that we know the API, it's time to dig into what happens when we call that `commitUpdate` function. Make sure to check out the [Relay Mutation Docs][relaydocs] if you're confused, or not familiar with Relay Mutations!

# Mutation Transactions

The first step in executing a mutation for Relay is to create a Transaction object and enqueue in the `RelayMutationQueue`. The `RelayMutationQueue` is an object used coordinate all mutations in your app. It will take care of optimistic payloads, rollbacking those when the server response changes, and even manage collision keys. (Mutations with the same collision should be ran serially).

## Creating a transaction

 

As always you can find me on Twitter [@\_\_xuorig\_\_][twit] or [Github][xuo]

[globalid]: https://github.com/rails/globalid
[twit]: https://twitter.com/__xuorig__
[xuo]: http://github.com/xuorig
[relaydocs]: https://facebook.github.io/relay/docs/guides-mutations.html#content
[read]: http://mgiroux.me/2016/quick-dive-into-relay-query-fetching/
[range]: http://mgiroux.me/2016/the-mysterious-relay-range-behaviours/

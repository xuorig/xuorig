---
title:  "Navigating and understanding large code bases"
date:   2016-11-12 11:00:00
description: How to quickly get up and running within a new project or understand an open source library.
---

You've just landed your new dream job and you're given your first issue to fix in a gigantic code base. Or maybe you're digging into a library to understand what the hell is going on in your app. Sometimes it can feel a bit overwhelming. Where do you start ?

I'm personally kind of addicted to understanding the libraries I use. In the past few months I've read a bunch of open source stuff out there but also a lot of code at Shopify, where we have a huge Rails code base. I like to think that I'm getting slightly faster at understanding code and I've developed some kind of system for how I approach a complicated piece of code. I thought I'd formalize it in this blog post. Let's get to it!

*Disclaimer: These are things that work well for me but everybody learns in a different way, so these tricks might be completely useless for you but maybe they'll help you!*

## 1. Always Be Writing

The most important thing for me is to write down what I find and learn. So many times I'll go through a codebase and think I understand it, only to come back to it 2 weeks later and having to learn things again because I forgot.

I personally use private [gists][gists] for that. My latest example is probably from my dive into RPM, New Relic's Ruby Client. My notes looked like [this][rpm].

As you can see hey don't have to be written down in a nice way. It's really just for you; to remember and visualize it better.

## 2. Find an entry point

I like to think about a code base like some kind of directed graph. You can often pick a function call and follow it through edges until you can't continue anymore. But which path should you explore? I like to pick an entry point into that graph that makes sense. Usually, if it's a library, I would pick the main public API method and follow the path.

For example, when I was diving into [Relay's Codebase][relay] I picked `RelayRenderer` as the main entry point and followed along to figure out how Relay was querying a GraphQL endpoint.

## 3. Prune branches

Every time we hit a new Graph "node" which would for example be the body of a method, we usually end up expanding our choice of paths. For example, take this fake method as an example:

```javascript
function getDataFromAPI(params, apiEndpoint) {
  if (params.something) {
    params = getNewParamsFromParams(params);
  }

  if (validateApiEndpoint(apiEndpoint)){
    queryAPI(params, apiEndpoint);
  } else {
    handleApiEndpointInvalid();
  }
}
```

There's quite a few things happening in this method. Here's what our graph looks like
for this region.

```bash
                       +------------------+
                       |                  |
                       |  getDataFromAPI  |
                       |                  |
                       +--+------+-----+--+
                          |      |     |
                          |      |     |
                          |      |     |
                          |      |     |
                          |      |     |
        +-----------------+      |     +----------------+
        |                        |                      |
        |                        |                      |
        v                        v                      v
getNewParamsFromParams  handleApiEndpointInvalid     queryAPI
```

We've got 4 choices to explore now.

  - __A:__ We could try and inspect what `getNewParamsFromParams` does, and why it's called when `params.something` is present.
  - __B:__ We could check out what happens when the `apiEndpoint` is invalid.
  - __C:__ We could see what happens in `queryAPI`
  - __D:__ Explore all the things!

Option D is rarely a good choice for me for a few reasons. First, we just added 3 new paths to explore. The number of nodes to understand just grew by a lot, and we have no way of knowing how deep we'll have to search before we come back to `getDataFromAPI`. The second reason I don't like option D is that not all code paths are important for us, especially on a *first read*.

In this case, Option C would make the most sense. We have to remember what we were searching for in the first place: How is data fetched from that API. Error handling can be understood after, and edge cases don't matter a this point. We're looking a general understanding of the code base.

Coming back to point #1, I always document the path I take by writing the file name I'm exploring, the class I'm in, the method called, and a summary of what is done in there.

To summarize this point: *Aggressively try to prune certain paths from your traversal. Avoid expanding in breath, focus on depth first.*

__In reality, what we're doing is pretty close to a [Best-First Search][bfs], where the heuristic function is decided by your brain. You have to guess which branch will lead you to your goal of understanding a particular piece of code.__

## 4. Multiple passes

In point 3, I suggested you aggressively cut "useless" branches that won't lead you to what you're really interested in a method. In reality, I like to do multiple "passes" on a code base. On the first pass, I'll cut a lot of corners, cut almost all branches except the main one.

On the subsequent passes, I'll start going into some of those branches. Since   we already have a general understanding of the code base, these branches start to make more sense to us.

## 5. Don't use if you don't understand

I'll admit that point is a bit extreme and even I don't always follow it 100%. But just trying to follow it can yield awesome results: try to never use a Class, Function, Library, API, without knowing a bit of it's internals.

In theory we should only care about the interface, and that's enough to write great software. But for personal development, trying to dive into everything to use helps you learn so much faster in my experience.

## Bonus: Time

![Time Gif](https://media.giphy.com/media/xTiQywlOn0gKyz0l56/giphy.gif)

Understanding complicated code bases has no shortcuts. These tricks help me make sense out of them much faster, but in the end, you really just need to put time aside to really understand what you work on or what you use.

Hope these tricks help you and if not, please share what worked for you! As always, you can find me on Twitter [@\_\_xuorig\_\_][twit] or [Github][xuo]

[xuo]: http://github.com/xuorig
[twit]: https://twitter.com/__xuorig__
[rpm]: https://gist.github.com/xuorig/85c04a97d85e16756338638b9b2db1a3
[relay]: http://mgiroux.me/2016/quick-dive-into-relay-query-fetching/
[gists]: https://gist.github.com/
[bfs]: https://en.wikipedia.org/wiki/Best-first_search

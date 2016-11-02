import React from 'react'
import { Link } from 'react-router'
import sortBy from 'lodash/sortBy'
import { prefixLink } from 'gatsby-helpers'
import Helmet from "react-helmet"
import access from 'safe-access'
import { config } from 'config'
import include from 'underscore.string/include'
import Profile from 'components/Profile'
import PostItem from 'components/PostItem'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

import '../css/global.css';

class BlogIndex extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      postCount: 4
    }

    this.onLoadMore = this.loadMore.bind(this);
  }

  loadMore() {
    this.setState((prevState, props) => {
      return {
        postCount: prevState.postCount + 4
      };
    });
  }

  render () {
    let posts = [];

    const sortedPosts = sortBy(this.props.route.pages, (page) =>
      access(page, 'data.date')
    ).reverse();

    sortedPosts.forEach(post => {
      if (access(post, 'file.ext') === 'md' && !include(post.path, '/404')) {
        const title = access(post, 'data.title') || post.path

        posts.push(
          <PostItem
            key={post.path}
            title={post.data.title}
            desc={post.data.description}
            date={post.data.date}
            path={post.path}
          />
        )
      }
    });

    posts = posts.slice(0, this.state.postCount);

    let endContent;

    if (this.state.postCount < sortedPosts.length - 1) {
      endContent = (<div className="load-more">
        Haven't found what you're looking for? <button onClick={this.onLoadMore}>Load More!</button>
      </div>)
    } else {
      endContent = (<div className="love">
        <span>You've reached the end. Made with ❤️ in Montreal</span>
      </div>)
    }

    return (
      <div className="wrapper">
        <Helmet
          title={config.blogTitle}
          meta={[
            {"name": "description", "content": "Marc-Andre Giroux's Blog"},
            {"name": "keywords", "content": "blog, Marc-Andre, Giroux, GraphQL, React, Relay, Rails, Ruby"},
          ]}
        />

        <Profile />

        <section className="post-list">
          <h2 style={{
            marginTop: 0,
            marginBottom: 40,
            fontWeight: 300,
            fontSize: 29
          }}>
            Recent Posts
          </h2>

		  <ReactCSSTransitionGroup
			transitionName="post-list__item"
			transitionEnterTimeout={500}
			transitionLeaveTimeout={300}
            transitionAppear={true}
            transitionAppearTimeout={500}>
			{posts}
		  </ReactCSSTransitionGroup>

          {endContent}
        </section>
      </div>
    )
  }
}

BlogIndex.propTypes = {
  route: React.PropTypes.object,
}

export default BlogIndex

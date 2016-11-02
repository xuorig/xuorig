import React from 'react'
import { Link } from 'react-router'
import { prefixLink } from 'gatsby-helpers'
import { prune } from 'underscore.string'
import include from 'underscore.string/include'
import access from 'safe-access'

class ReadNext extends React.Component {
  render () {
    const { pages } = this.props

    const posts = pages.filter(page => {
      return access(page, 'file.ext') === 'md' && !include(page.path, '/404');
    });

    const randIndex = Math.floor(Math.random() * posts.length);
    const nextPost = posts[randIndex];
    const html = nextPost.data.body
    const body = prune(html.replace(/<[^>]*>/g, ''), 200)

    return (
      <div style={{marginBottom: '30px'}}>
        <h6>
          READ THIS NEXT:
        </h6>
        <h3>
          <Link to={{pathname: prefixLink(nextPost.path)}}>
            {nextPost.data.title}
          </Link>
        </h3>
        <p>{body}</p>
      </div>
    )
  }
}

ReadNext.propTypes = {
  post: React.PropTypes.object.isRequired,
  pages: React.PropTypes.array,
}

export default ReadNext

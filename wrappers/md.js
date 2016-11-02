import React from 'react'
import moment from 'moment'
import Helmet from "react-helmet"
import ReadNext from '../components/ReadNext'
import { config } from 'config'
import Profile from 'components/Profile'
import Disqus from 'components/Disqus'
import { prefixLink } from 'gatsby-helpers'
import { Link } from 'react-router'

import '../css/zenburn.css'
import '../css/post.css'
import '../css/global.css'

class MarkdownWrapper extends React.Component {
  render () {
    const { route } = this.props
    const post = route.page.data
    const formattedDate = moment(post.date).format('LL');
    const title = post.title || config.blogTitle;

    return (
      <div className="wrapper markdown">
        <Helmet
          title={title}
        />
        <h1 className="post__title">{post.title}</h1>
        <p className="post__date">{formattedDate}</p>
        <div dangerouslySetInnerHTML={{ __html: post.body }} />

        <p style={{textAlign: 'center', fontWeight: 'bold', marginTop: 30}}>Go back to <Link to={prefixLink('/')}>Recent Posts</Link> ✍️</p>
        <hr/>
        <ReadNext post={post} pages={route.pages} />
        <Disqus />
      </div>
    )
  }
}

MarkdownWrapper.propTypes = {
  route: React.PropTypes.object,
}

export default MarkdownWrapper

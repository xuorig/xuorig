import React from 'react'
import '../css/posts.css';
import { Link } from 'react-router'
import { prefixLink } from 'gatsby-helpers'
import moment from 'moment'

class PostItem extends React.Component {
  render () {
    const formattedDate = moment(this.props.date).format('ll');

    return (
	  <Link
        className="post-list__item"
        to={prefixLink(this.props.path)}
      >
		<article>
		  <header className="post-list__item__header">
			<h1 className="post-list__item__header__title">{this.props.title}</h1>
			<span className="post-list__item__header__date">{formattedDate}</span>
		  </header>
		  <div>
			<p className="post-list__item__desc">{this.props.desc}</p>
		  </div>
		</article>
      </Link>
    )
  }
}

PostItem.propTypes = {
  title: React.PropTypes.string,
  desc: React.PropTypes.string,
  date: React.PropTypes.string,
}

export default PostItem

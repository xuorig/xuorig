import React from 'react'
import mePic from './me.jpg';
import '../css/profile.css';
import { prefixLink } from 'gatsby-helpers'
import { Link } from 'react-router'

class SectionHeader extends React.Component {
  render () {
    const { title, subtitle } = this.props;

    return (
      <header className="me">
        <div className="me__photo">
          <img src={mePic} alt="Marc-Andre Giroux's Photo" className="me__photo__avatar"/>
        </div>

        <div className="me__profile">
          <h1 className="me__profile__name">{title}</h1>
          <h2 className="me__profile__desc">
            {subtitle}
          </h2>
          <p>
            Or go back to <Link to={prefixLink('/')}>Home</Link> 🏠
          </p>
        </div>
      </header>
    )
  }
}

export default SectionHeader;

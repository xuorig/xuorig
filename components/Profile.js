import React from 'react'
import { config } from 'config'
import { prefixLink } from 'gatsby-helpers'
import { Link } from 'react-router'
import mePic from './me.jpg';

import '../css/profile.css';

class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      x: 0.0,
      direction: 0.1
    }
    this.animationRequestId = null;
  }

  componentDidMount() {
    this.animationRequestId = window.requestAnimationFrame(this.animateX.bind(this));
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.animationRequestId);
  }

  animateX() {
    this.setState(() => {
      return {
        x: (Math.random() * 10).toFixed(1),
      };
    });

    window.setTimeout(() => {
      window.requestAnimationFrame(this.animateX.bind(this));
    }, 800);
  }

  render () {
    return (
      <header className="me">
        <div className="me__photo">
          <img src={mePic} alt="Marc-Andre Giroux's Photo" className="me__photo__avatar"/>
        </div>

        <div className="me__profile">
          <h1 className="me__profile__name">Marc-André Giroux</h1>
          <h2 className="me__profile__desc">
            <span className="purple">
              {this.state.x}x
            </span> platform interface engineer <a href="https://github.com">@github</a> - GraphQL Enthusiast - Speaker.
          </h2>

          <p>
            Feel free to <a href="https://github.com/xuorig">check out my code</a> 🚀
          </p>

          <p>
            Follow me on <a href="https://twitter.com/__xuorig__">Twitter</a> 🐦
          </p>

          <p>
            Check out where I'm <Link to={prefixLink('/speaking/')}>speaking next</Link> 📢
          </p>
        </div>
      </header>
    )
  }
}

export default Profile

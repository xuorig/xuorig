import React from 'react'
import '../css/talks.css'
import moment from 'moment'

class Talk extends React.Component {
  constructor(props) {
    super(props);

    this.uniqueId =
      this.props.talk.name +
      this.props.talk.event;

    this.uniqueId = this.uniqueId.replace(/ /g, '');
  }

  componentDidMount() {
	const location = {
      lat: this.props.talk.lat,
      lng: this.props.talk.long
    };

	const map = new window.google.maps.Map(
      document.getElementById(this.uniqueId), {
	  zoom: 4,
	  center: location,
	  disableDefaultUI: true
	});

	const marker = new window.google.maps.Marker({
	  position: location,
	  map: map
	});
  }

  render () {
    const {
      name,
      event,
      location,
      date,
      cancelled,
      url,
      slides,
      video
    } = this.props.talk;

    const titleClass = "talk-list__talk__content__name" + (cancelled ? " talk-list__talk__content__name--cancelled" : "")

    const cancelledContent = cancelled ? <span className="cancelled"> (Cancelled)</span> : null;

    const slidesContent = slides ?
      <p><a href={slides}>View Slides</a></p> :
      null;

    const videoContent = video ?
      <p><a href={video}>View Recording</a></p> :
      null;

    return (
      <div className="talk-list__talk">
        <div id={this.uniqueId} className="talk-list__talk__map">
        </div>
        <div className="talk-list__talk__content">
          <p>
            <a href={url} className={titleClass}>{name}</a>
            {cancelledContent}
          </p>
          <p className="talk-list__talk__content__event">{event}</p>
          <p className="light">{location}</p>
          <p className="light">{moment(date).fromNow()}</p>
          {slidesContent}
          {videoContent}
        </div>
      </div>
    )
  }
}

export default Talk;

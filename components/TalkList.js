import React from 'react'
import '../css/talks.css';
import Talk from './Talk';
import talks from '../data/talks.js'
import moment from 'moment'

class TalkList extends React.Component {
  render () {
    const upcoming = [];
    const past = [];

    const allTalks = talks.sort(function(dateX, dateY) {
      if (dateX <= dateY) {
        return -1;
      } else if (dateY >= dateX) {
        return 1;
      } else {
        return 0;
      }
    });

    allTalks.forEach(talk => {
      const date = moment(talk.date);
      if (date >= moment()) {
        upcoming.push(talk);
      } else {
        past.push(talk);
      }
    });

    const upcomingTalks = upcoming.map(talk => {
      return <Talk key={talk.name + talk.event} talk={talk}/>
    });

    const pastTalks = past.map(talk => {
      return <Talk key={talk.name + talk.event} talk={talk}/>
    });

    return (
      <section className="talk-list">
		<h2 style={{
		  marginTop: 0,
		  marginBottom: 40,
		  fontWeight: 300,
		  fontSize: 29
		}}>
		  Upcoming Talks
		</h2>

        {upcomingTalks}

		<h2 style={{
		  marginTop: 40,
		  marginBottom: 40,
		  fontWeight: 300,
		  fontSize: 29
		}}>
		  Past Talks
		</h2>

        {pastTalks}
      </section>
    )
  }
}

export default TalkList;

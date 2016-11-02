import React from 'react'
import { Link } from 'react-router'
import { prefixLink } from 'gatsby-helpers'

class Disqus extends React.Component {
  componentDidMount() {
    const disqus_shortname = 'marcandregirouxblog';
    const disqus_developer = 0;

    const dsq = document.createElement('script');
    dsq.type = 'text/javascript';
    dsq.async = true;
    dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';

    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
  }

  render () {
    return (
	  <section className="disqus">
		<div id="disqus_thread"></div>
		<script type="text/javascript">
		</script>
	  </section>
    )
  }
}

export default Disqus

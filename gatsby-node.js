import fs from 'fs-extra-promise'
import sm from 'sitemap'

function pagesToSitemap(pages) {
  const urls = pages.map((p) => {
    if (p.path !== undefined) {
      return {
        url: p.path,
        changefreq: 'daily',
        priority: 0.7
      }
    }
  })
  // remove undefined (template pages)
  return urls.filter(u => u !== undefined)
}

function generateSiteMap(pages) {
  const sitemap = sm.createSitemap({
    hostname: 'https://www.example.com',
    cacheTime: '60000',
    urls: pagesToSitemap(pages),
  })
  console.log('Generating sitemap.xml')
  fs.writeFileSync(
    `${__dirname}/public/sitemap.xml`,
    sitemap.toString()
  )
}

export function postBuild(pages, callback) {
  generateSiteMap(pages)
  callback()
}

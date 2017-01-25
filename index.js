const CONFIG = require('./config.json')

const APP_NAME = process.env.npm_package_name||require('./package.json').name,
      APP_VERSION = process.env.npm_package_version||require('./package.json').version

const fs = require('fs')
const path = require('path')

const fetch = require('node-fetch')
const express = require('express')

const photos = require('./lib/photos')

const app = express()

app.get('/', (req, res) => {
  locate().then( locate => res.send(
  `<html>
    <head>
     <title>Where is Flaki?</title>
     <link href="https://fonts.googleapis.com/css?family=Amatic+SC:400,700&amp;subset=latin-ext" rel="stylesheet">
     <style>
     body {
     	font-family: 'Amatic SC', cursive;
     	margin: 0;
     	width: 100%; height: 100%;
     	display: flex;
     }

     a {
     	color: inherit;
     	text-decoration: none;
     	font-weight: bold;
     }
     a:active, a:focus, a:hover {
     	text-decoration: underline;
     }

     main {
     	flex: 1;

     	background-image: url({{locpic}});
     	background-repeat: no-repeat;
     	background-size: cover;
     	background-position: center;

       color: white;
     	font-size: 5vmax;
      text-shadow: -.2vmax -.2vmax 2vmax rgba(0,0,0,90), .2vmax .2vmax 2vmax rgba(0,0,0,90), -.2vmax .2vmax 2vmax rgba(0,0,0,90), .2vmax -.2vmax 2vmax rgba(0,0,0,90);

     	display: flex;
     	justify-content: center;
     	align-items: flex-start;
      text-align: center;
     }
     </style>
    </head>
    <body>
      <main>
        <p>{{loc}}</p>
      </main>
    </body>
   </html>`
  .replace('{{loc}}', locate.locationHTML)
  .replace('{{locpic}}', locate.photos[Math.random()*6|0])
  ))
})

app.use(express.static( path.join(__dirname, 'www') ))

app.listen(3463, _ => {
  console.log('[%s] Server started. (v%s)',
    APP_NAME,
    APP_VERSION
  )
})


function locate() {
  // TODO: do not query again for at least 10-15 minutes
  return fetch('https://api.foursquare.com/v2/users/self/checkins?oauth_token='+CONFIG.auth.foursquare+'&v=20170122&limit=1')
    .then(r => r.json() )

    /// Create output object
    .then(r => {
      fs.writeFileSync(path.join(__dirname,'data/swarm-result.json'), JSON.stringify(r, null, 1))

      let { response: { checkins: { items: [ last_checkin ]}}} = r
      return ({
        checkin: last_checkin,
        checkinUrl: `https://www.swarmapp.com/slsoftworks/checkin/${last_checkin.id}`,
        ts: new Date().getTime(),
        tsDiff: findtime(last_checkin.createdAt*1000)
      })

    // Add photo
    }).then(c => {
      c.photos = []

      const apiReq = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${CONFIG.auth.flickr}&sort=relevance&per_page=6&format=json&nojsoncallback=1&text=`+encodeURIComponent(`${c.checkin.venue.location.city} architecture skyline`)
      console.log(apiReq)

      return fetch(apiReq).then(r => r.json())
        .then(r => {
          fs.writeFileSync(path.join(__dirname,'data/flickr-result.json'), JSON.stringify(r, null, 1))

          r.photos.photo.forEach(p => c.photos.push( photos.JSONToPhotoURL(p)))

          return c
        }).catch(e => c)

    }).then(c => {
      fs.writeFileSync(path.join(__dirname,'data/last-checkin.json'), JSON.stringify(c, null, 1))

      c.locationHTML = `Flaki was ${c.tsDiff} in ${c.checkin.venue.location.city}, at <a target="_blank" href="${c.checkinUrl}">${c.checkin.venue.name}</a>.`
      console.log(c.locationHTML)

      return c
    }).catch(e => {
      console.log(e)

      return 'Haven\'t yet seen flaki around...'
    })
}

function findtime(ts) {
  let tdiff = Math.floor( (new Date() - ts)/1000 )

  // Less than one hour
  if (tdiff < 60*60) {
    return 'just seen'

  // Less than twelve hours
  } else if (tdiff < 12*60*60) {
    return 'today'

  // Recently
  } else {
    return 'recently'
  }

  return tdiff
}

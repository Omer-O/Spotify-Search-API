require('dotenv').config();
const express = require('express');
const hbs = require('hbs');
const app = express();

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

// require spotify-web-api-node package here:
const SpotifyWebApi = require('spotify-web-api-node');
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

// Retrieve an access token
spotifyApi
  .clientCredentialsGrant()
  .then(data => spotifyApi.setAccessToken(data.body['access_token']))
  .catch(error => console.log('Something went wrong when retrieving an access token', error));

// routes go here //

app.get("/", (req, res) => {
    res.render("artist-search");
});
app.get("/artist-search", (req, res) => {
    const searchInput = req.query.search;

    // error MSG if no input was given //

    if (searchInput.length === 0) {
        res.render("artist-search", {
            err: "Please enter name"
        });
    } else {
        spotifyApi
        .searchArtists(searchInput, { limit: 20 })
        .then(data => {
            const artistData = data.body.artists;

        // error MSG if artist not found //

            let artistValidName = artistData.total;
            if ( artistValidName === 0) {
                res.render("artist-search", {
                    err: "Artist was not found"
                });
            } else {
                let results = artistData.items;
                let next = artistData.next;
                results.map(artist => {
                    if (artist.images.length === 0) {
                        artist.images = [{ url: "/images/dude.jpg" }];
                    }
                    if (artist.images.length > 0) {
                        artist.images = artist.images[0];
                    }
                });
                if (results.length > 0) {
                    console.log('this is results', results);
                    res.render("artist-search-results", {
                        results: results,
                        next: next
                    });
                }
            }
        })
        .catch(err => {
            console.log('The error while searching artists occurred: ', err);
        });
    }
});

// Get album of artist by ID //

app.get('/albums/:artistId', (req, res, next) => {
    let artistById = req.params.artistId;
    spotifyApi.getArtistAlbums(artistById, {limit: 20})
    .then(data => {
        let results = data.body.items;
        results.map(item => {
          item.artists = item.artists[0].name;
          if (item.images.length === 0) {
              item.images = "/images/dude.jpg";
          } else {
              item.images = item.images[0];
          }
      })
      console.log('Artist albums', results[0].artists);
      res.render("albums", {
          results: results,
          artists_name: results[0].artists
      })
  }).catch(err => {
      console.error(err);
    });
});


// Get privew tracks of album //

app.get('/tracks/:trackId', (req, res) => {
    let track = req.params.trackId;
    spotifyApi.getAlbumTracks(track, { limit : 10 })
      .then(function(data) {
        let results = data.body.items;
        results.map(item => {
            item.artists = item.artists[0].name;
        });
        res.render('tracks', {
            results: results,
            album: results[0].artists
        })
      }, function(err) {
        console.log('Something went wrong!', err);
      });
});

app.listen(process.env.PORT || 3000, () => console.log('My Spotify project running on port 3000 🎧 🥁 🎸 🔊'));

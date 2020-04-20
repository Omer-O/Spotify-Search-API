require('dotenv').config();

const express = require('express');
const hbs = require('hbs');

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

const app = express();

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

// setting the spotify-api goes here:

// Our routes go here:
app.get("/", (req, res) => {
    res.render("artist-search");
});
app.get("/artist-search", (req, res) => {
    spotifyApi
      .searchArtists(req.query.search, { limit: 20 })
      .then(data => {
          let results = data.body.artists.items;
          let next
        results.map(artist => {
            if (artist.images.length === 0) {
                artist.images = [{ url: "/images/dude.jpg" }];
            }
            if (artist.images.length > 0) {
                artist.images = artist.images[0];
            }
        });
        console.log('this is results', results);
        res.render("artist-search-results", {
            results: results,
            next: data.body.artists.next
        })
      })
      .catch(err => console.log('The error while searching artists occurred: ', err));
});

// Get album of artist by ID
app.get('/albums/:artistId', (req, res, next) => {
    let artistById = req.params.artistId;
    spotifyApi.getArtistAlbums(artistById, {limit: 20})
    .then(function(data) {
        let results = data.body.items;
      data.body.items.map(item => {
          // console.log('this is item inside map', item);
          if (item.images.length === 0) {
              item.images = "/images/dude.jpg";
          } else {
              item.images = item.images[0];
          }
      })
      console.log('Artist albums', results);
      res.render("albums", {
          results: results
      })
    }, function(err) {
      console.error(err);
    });
});

// Get privew tracks of album
app.get('/tracks/:trackId', (req, res) => {
    let track = req.params.trackId;
    spotifyApi.getAlbumTracks(track, { limit : 10 })
      .then(function(data) {
        console.log(data.body.items);
        res.render('tracks', {
            results: data.body.items
        })
      }, function(err) {
        console.log('Something went wrong!', err);
      });
});
app.listen(3000, () => console.log('My Spotify project running on port 3000 🎧 🥁 🎸 🔊'));

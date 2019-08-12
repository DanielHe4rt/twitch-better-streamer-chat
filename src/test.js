const SpotifyWebApi = require('spotify-web-api-node');
const data = require('../config.json');
// credentials are optional
const spotifyApi = new SpotifyWebApi({
  clientId: data.spotify_id,
  clientSecret: data.spotify_secret,
  redirectUri: 'http://localhost/',
  accessToken: 'BQA7b4G19Efh7VfjxOlsj6nD18WV7gwrYoEaB0P4ciCLJD6JP-ib_e99XEr9lLK1Y_oCUyOUB1zQ24o7u4vcd2vO2ctTIYwTm1eK9OzEgZt4x7e12MWrT9QgU5hxL_iTciOahVs5yIScQTgupHPVYirwb7aYSk70X09wTABr5HAyLpYFP0BDJxWgR1UtwYevWTQSNzSsSfzx_7R5NSPFPks5EChvPlHwaWZzXMkNmu3T6g',
});


spotifyApi.addTracksToPlaylist('21JDnkT9kCsqkeTWX6yz4d',
  ['spotify:track:4iV5W9uYEdYUVa79Axb7Rh',
    'spotify:track:1301WleyT98MSxVHPZCA6M'])
  .then(() => {
    console.log('Added tracks to playlist!');
  }, (err) => {
    console.log('Something went wrong!', err);
  });

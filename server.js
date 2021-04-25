'use strict';
const express = require('express');

require('dotenv').config();
const cors = require('cors');

const server = express();

const PORT = process.env.PORT || 3050;
server.use(cors());

server.use(express.static('./public'));


server.get('/location', (req, res) => {
  let locationData = require('./data/location.json');
  let locationRes = new Location(locationData);

  res.send(locationRes);
  res.send('hello');

})

function Location(locationName) {
  this.display_name = locationName[0].display_name;
  this.lat = locationName[0].lat;
  this.lon = locationName[0].lon;
}

server.listen(PORT, () => {
  console.log('listing to the Port number: ' + PORT);
});

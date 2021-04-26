'use strict';
const express = require('express');

require('dotenv').config();
const cors = require('cors');

const server = express();

const PORT = process.env.PORT || 3050;
server.use(cors());


server.get('/location', (req, res) => {
  let locationData = require('./data/location.json');
  let locationRes = new Location(locationData);

  res.send(locationRes);

})

function Location(locationName) {
  this.search_query= 'Lynnwood',
  this.formatted_query = locationName[0].display_name;
  this.latitude = locationName[0].lat;
  this.longitude = locationName[0].lon;
}

server.listen(PORT, () => {
  console.log('listing to the Port number: ' + PORT);
});



function Weather(weatherName) {
  this.forecast = weatherName.weather.description;
  this.time = weatherName.valid_date;
}



server.get('/weather', (req, res) => {
  let weatherArr = [];
  let weatherData = require('./data/weather.json');
  weatherData.data.forEach((item) => {
    let weathers = new Weather(item);
    weatherArr.push(weathers)
  })

  res.status(200).send(weatherArr);
});

server.get('*', (req, res) => {
  res.status(500).send('Sorry, something went wrong');
})

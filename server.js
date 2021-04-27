'use strict';
const express = require('express');

require('dotenv').config();
const cors = require('cors');

const server = express();
const superagent = require('superagent');

const PORT = process.env.PORT || 3050;
server.use(cors());

server.get('/location', locationHandelr);
server.get('/weather', weatherHandler);
server.get('/parks', parkHandler);

server.get('*', generalHandler);

//  Location Data ................

function locationHandelr(req, res) {

  let cityName = req.query.city;

  let key = process.env.LOCATION_KEY;
  let locURL = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

  superagent.get(locURL) //send a request locatioIQ API
    .then(geoData => {

      let gData = geoData.body;
      let locationData = new Location(cityName, gData);
      res.send(locationData);

    })

    .catch(error => {
      console.log(error);
      res.send(error);
    });
}
function Location(cityName, locData) {
  this.search_query = cityName;
  this.formatted_query = locData[0].display_name;
  this.latitude = locData[0].lat;
  this.longitude = locData[0].lon;
}


//  weather Data ................
function Weather(weathData) {

  this.forecast = weathData.weather.description;
  this.time = weathData.valid_date;
}



server.get('/weather', weatherHandler);

function weatherHandler(req, res) {
  let cityName = req.query.city;

  let key = process.env.WAEATHER_KEY;
  let weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${key}`
  ;

  superagent.get(weatherURL) //send a request locatioIQ API
    .then((geoData) => {
      let gData = geoData.body;



      let weatherArr = gData.data.map((item) => new Weather(item));


      res.status(200).send(weatherArr.slice(0,8));

    })

    .catch(error => {
      console.log(error);
      res.send(error);
    });
}
//  Parks Data ................

function Parks(parkData) {
  this.name = parkData.fullname;
  this.address = parkData.addresses[0].city, parkData.addresses[0].line1, parkData.addresses[0].line2;
  this.fee = parkData.entranceFees[0].cost;
  this.description = parkData.description;
}

function parkHandler(req, res) {
  let cityName = req.query.search_query;

  let key = process.env.PARKS_API_KEY;



  let parkURL = `https://developer.nps.gov/api/v1/parks?parkCode=${cityName}&api_key=${key}`;


  superagent.get(parkURL) //send a request locatioIQ API
    .then((parksData) => {
      let pData = parksData.body;

      let parksArr = pData.data.map((item) => new Parks(item));


      res.status(200).send(parksArr);

    })

    .catch(error => {
      console.log(error);
      res.send(error);
    });
}


//  general pages ................

function generalHandler(req, res) {
  let errorPage = {
    status: 500,
    resText: 'sorry! you can not access this page',
  };
  res.status(500).send(errorPage);
}


server.listen(PORT, () => {
  console.log('listing to the Port number: ' + PORT);
});

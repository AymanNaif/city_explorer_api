'use strict';
const express = require('express');

require('dotenv').config();
const cors = require('cors');

const server = express();
const superagent = require('superagent');
const pg = require('pg');

let client;
let DATABASE_URL = process.env.DATABASE_URL;
let ENV =  process.env.ENV||'';
if (ENV === 'DEV') {
  client = new pg.Client({
    connectionString: DATABASE_URL
  });
} else {
  client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: {}
  });
}

const PORT = process.env.PORT || 3050;
server.use(cors());

server.get('/location', locationHandelr);



//  Location Data ................
function locationHandelr(req, res) {
  let cityName = req.query.city;
  let key = process.env.LOCATION_KEY;
  let locURL = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
  let safeValues = [cityName];
  let SQL = `SELECT DISTINCT search_query,formatted_query,latitude,longitude FROM locations WHERE search_query=$1;`;
  client.query(SQL, safeValues)
    .then(result => {
      res.send(result.rows);
    })
    .catch(error => {
      res.send(error);
    });
  superagent.get(locURL)
    .then(geoData => {
      let gData = geoData.body;
      let locationData = new Location(cityName, gData);
      let safeValues = [locationData.search_query, locationData.formatted_query, locationData.latitude, locationData.longitude];
      let SQL = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1, $2, $3, $4) RETURNING *;`;
      client.query(SQL, safeValues)
        .then(result => {
          res.send(result);
        })
        .catch(error => {
          res.send(error);
        });
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
  this.time = new Date(weathData.valid_date).toDateString();
}



server.get('/weather', weatherHandler);

function weatherHandler(req, res) {
  let cityName = req.query.search_query;

  let key = process.env.WAEATHER_KEY;
  let weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${key}`;

  superagent.get(weatherURL) //send a request locatioIQ API
    .then((geoData) => {
      let gData = geoData.body;



      let weatherArr = gData.data.map((item) => new Weather(item));


      res.status(200).send(weatherArr.slice(0, 8));

    })


}
//  Parks Data ................
server.get('/parks', parkHandler);

function Parks(parkData) {
  this.name = parkData.fullname;
  this.address = parkData.addresses[0].city, parkData.addresses[0].line1, parkData.addresses[0].line2;
  this.fee = parkData.entranceFees[0].cost;
  this.description = parkData.description;
}

function parkHandler(req, res) {
  let cityName = req.query.q;

  let key = process.env.PARKS_API_KEY;



  let parkURL = `https://developer.nps.gov/api/v1/parks?q=${cityName}&api_key=${key}`;

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
server.get('*', generalHandler);

function generalHandler(req, res) {
  let errorPage = {
    status: 500,
    resText: 'sorry! you can not access this page',
  };
  res.status(500).send(errorPage);
}

client.connect()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`listening on port ${PORT}`);
    });

  });

// movies Data


server.get('/movies', moviesHandler);

function Movies(moviesData) {
  this.original_title = moviesData.result[0].title;
  this.overview = moviesData.result[0].overview
  this.average_votes = moviesData.result[0].vote_average;
  this.total_votes = moviesData.result[0].vote_count;
  this.image_url = moviesData.result[0].backdrop_path;
  this.popularity = moviesData[0].popularity;
  this.released_on = moviesData[0].released_on;
}

function moviesHandler(req, res) {
  let movieName = req.query.append_to_response;

  let key = process.env.MOVIE_API_KEY;



  let moviesURL = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${movieName}`;

  superagent.get(moviesURL) //send a request locatioIQ API
    .then((moviesData) => {
      let mData = moviesData.body;

      let moviesArr = mData.data.map((item) => new Movies(item));


      res.status(200).send(moviesArr);

    })

    .catch(error => {
      console.log(error);
      res.send(error);
    });
}

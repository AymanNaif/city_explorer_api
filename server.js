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


server.get('*', generalHandler);

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

//  general pages ................

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

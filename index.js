const express = require('express')
require('dotenv').config()
const { checkAuth } = require('./src/mid')
const { importAirports, searchFlights } = require('./src/controllers')

const app = express()
app.use(express.json())

app.use(checkAuth)

app.get('/importAirports', importAirports)

app.get('/search/:departure_airport/:arrival_airport/:outbound_date/:inbound_date?', searchFlights)


app.listen(process.env.PORT | 8001) 
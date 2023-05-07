const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { checkAuth } = require('./src/mid')
const { importAirports, searchFlights, updateAirportStatus, getAirports } = require('./src/controllers')

const app = express()
app.use(express.json())

app.use(cors())

app.use(checkAuth)

app.get('/importAirports', importAirports)

app.get('/getAirports', getAirports)

app.patch('/airportStatus/:iata', updateAirportStatus)

app.get('/search/:departure_airport/:arrival_airport/:outbound_date/:inbound_date?', searchFlights)


app.listen(process.env.PORT || 8001)
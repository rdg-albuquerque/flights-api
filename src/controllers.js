
const axios = require('axios').default
const format = require('pg-format')
const query = require('../db')
const {to2decimals, calculateDistance, calculateSpeed, calculateCost, isValidDate, isValidIata} = require('./helpers')

const importAirports = async (req, res) => {
    try {
        const {data: updatedAirports} = await axios.get(`${process.env.AIRPORTS_API_BASE_URL}/airports/pzrvlDwoCwlzrWJmOzviqvOWtm4dkvuc`, {
            auth: {
                username: process.env.AIRPORTS_API_USERNAME,
                password: process.env.AIRPORTS_API_PASSWORD,
            }        
        })

        if (!updatedAirports) {
            // Something went wrong with the airports API
            return res.status(500).json({message: 'Something went wrong, try again latter'})
        }

        const updatedAirportsList = Object.values(updatedAirports)

        const {rowCount, rows: dbAirports} = await query('Select * from airports')

        if (rowCount === 0) {
            // Airports table is empty, adding all airports
            const formattedAirportsData = updatedAirportsList.map(airport => {
                if (!airport.iata | !airport.city | !airport.lat | !airport.lon | !airport.state) {
                    return res.status(500).json({message: 'Something went wrong, try again latter'})
                }
                return [
                    airport.iata,
                    airport.city,
                    airport.lat,
                    airport.lon,
                    airport.state
                ]
            })
            const queryText = format('INSERT into airports (iata, city, lat, lon, state) VALUES %L returning iata', formattedAirportsData)
            const {rowCount} = await query(queryText)
            if (rowCount <= 0) {
                return res.status(500).json({message: 'Something went wrong trying to update database'})
            }
            return res.status(201).json({message: 'Database has been updated'})
        } else if (rowCount > 0) {
            // Update airports table
            const airportsToAdd = updatedAirportsList
                .filter((airport) => !dbAirports.find(dbAirport => airport.iata === dbAirport.iata))
                .map(airport => {
                    return [
                        airport.iata,
                        airport.city,
                        airport.lat,
                        airport.lon,
                        airport.state
                    ]
                })

            const airportsToRemove = dbAirports
                .filter(dbAirport => !updatedAirportsList.find(airport => dbAirport.iata === airport.iata))
                .map(dbAirport => dbAirport.iata)

            if (airportsToAdd.length) {
                // Add airports from updated list that isn't in the database
                const queryText = format('INSERT into airports (iata, city, lat, lon, state) VALUES %L returning iata', airportsToAdd)
                const {rowCount} = await query(queryText)
                if (rowCount <= 0) {
                    return res.status(500).json({message: 'Something went wrong trying to add new airports to database'})   
                }
            }

            if (airportsToRemove.length) {
                // Remove airports from database that it's not in the updated list
                const queryText = format('DELETE from airports where iata IN (%L)', airportsToRemove)
                const {rowCount} = await query(queryText)
                if (rowCount <= 0) {
                    return res.status(500).json({message: 'Something went wrong trying to remove unavailable airports from database'})   
                }
            }

            res.status(201).json({message: 'Database has been updated'})
        }    
    } catch (error) {
        if (error.name === 'AxiosError' && error.response.statusText === 'Unauthorized') {
            return res.status(500).json({message: 'Username or password are invalid for third party API'})
        }
        res.status(500).json({message: error})
    }
}

const updateAirportStatus = async (req, res) => {
    var {iata} = req.params
    var {active} = req.body

    if (!isValidIata(iata)) {
        return res.status(400).json({message: 'Iata parameter is not in a valid format'})
    }

    if (active === null || active === undefined) {
        return res.status(400).json({message: 'Active body parameter for airport is required'})
    }

    try {
        const {rowCount} = await query('Update airports set active = $1 where iata = $2', [active, iata])

        if (rowCount === 0) {
            return res.status(400).json({message: 'Check if the informed iata is a valid iata'})
        }

        res.json({message: 'Airport status updated sucessfully'})
    } catch (error) {
        res.status(500).json({message: 'Something went wrong while trying to update airport status'})
    }

}

const searchFlights = async (req, res) => {
    var {departure_airport, arrival_airport, outbound_date, inbound_date} = req.params

    try {
        /* VALIDATIONS */
        if (!departure_airport || !arrival_airport || !outbound_date) {
            return res.status(400).json({message: 'Please make sure you provided all parameters'})
        }

        if (!isValidIata(departure_airport)) {
            return res.status(400).json({message: 'Departure airport iata is not in a valid format'})
        }

        if (!isValidIata(arrival_airport)) {
            return res.status(400).json({message: 'Arrival airport iata is not in a valid format'})
        }
    
        const {rows: dbAirports} = await query('Select iata from airports where iata IN ($1, $2)', [departure_airport, arrival_airport])
    
        const iatasFounded = dbAirports.map(airport => airport.iata)
    
        if (!iatasFounded.includes(departure_airport)) {
            return res.status(400).json({message: 'Departure airport is not available or does not exists'})
        }
    
        if (!iatasFounded.includes(arrival_airport)) {
            return res.status(400).json({message: 'Arrival airport is not available or does not exists'})
        }
    
        if (departure_airport === arrival_airport) {
            return res.status(400).json({message: 'Departure airport should not be the same as arrival airport'})
        }

        if (!isValidDate(outbound_date)) {
            return res.status(400).json({message: "Invalid outbound date. Please use a valid date in the format 'YYYY-MM-DD'"})
        }

        if (inbound_date && !isValidDate(inbound_date)) {
            return res.status(400).json({message: "Invalid inbound date. Please use a valid date in the format 'YYYY-MM-DD'"})
        }
    
        const now = new Date()
        var todayString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, 0)}-${now.getDate().toString().padStart(2, 0)}`

        const outboundTimestamp = new Date(outbound_date).getTime()
        const inboundTimestamp = new Date(inbound_date).getTime()
    
        if (outboundTimestamp < Date.parse(todayString)) {
            return res.status(400).json({message: "Outbound date should not be less than today's date"})
        }
    
        if (inboundTimestamp && inboundTimestamp < outboundTimestamp) {
            return res.status(400).json({message: 'Outbound date should not be greater than inbound date'})
        }
    
        /* END OF VALIDATIONS */
    
        const {data: outbound} = await axios.get(`${process.env.AIRPORTS_API_BASE_URL}/search/${process.env.AIRPORTS_API_KEY}/${departure_airport}/${arrival_airport}/${outbound_date}`, {
            auth: {
                username: process.env.AIRPORTS_API_USERNAME,
                password: process.env.AIRPORTS_API_PASSWORD,
            }        
        })

        let inbound

        if (inbound_date) {
            const {data: inboundData} = await axios.get(`${process.env.AIRPORTS_API_BASE_URL}/search/${process.env.AIRPORTS_API_KEY}/${arrival_airport}/${departure_airport}/${inbound_date}`, {
                auth: {
                    username: process.env.AIRPORTS_API_USERNAME,
                    password: process.env.AIRPORTS_API_PASSWORD,
                }        
            })
            inbound = inboundData
        }

        const minFeeTax = parseInt(process.env.MIN_FEE_TAX)

        const distance = calculateDistance(outbound.summary.from.lat, outbound.summary.from.lon, outbound.summary.to.lat, outbound.summary.to.lon)

        const outboundOptions = outbound.options.map(outboundOpt => {
            const fare = outboundOpt.price.fare
            const fees = Math.max(minFeeTax, fare * 0.1)
            return {
                outbound: {
                    ...outboundOpt,
                    price: {
                        ...outboundOpt.price,
                        fees: to2decimals(fees),
                        total: to2decimals(fare + fees)
                    },
                    meta: {
                        range: to2decimals(distance),
                        cruise_speed_kmh: calculateSpeed(outboundOpt.departure_time, outboundOpt.arrival_time, distance),
                        cost_per_km: calculateCost(fare, distance)
                    }
                }
            }
        })

        if(!inbound) {
            // One-way flights
            const outboundOptionsAsc = outboundOptions.sort((a, b) => a.outbound.price.total - b.outbound.price.total)
            const flights = {
                summary: {
                    outbound: outbound.summary,
                  },
                  options: outboundOptionsAsc

            }
            return res.json(flights)
        }

        const inboundOptions = inbound.options.map(inboundOpt => {
            const fare = inboundOpt.price.fare
            const fees = Math.max(minFeeTax, fare * 0.1)
            return {
                inbound: {
                    ...inboundOpt,
                    price: {
                        ...inboundOpt.price,
                        fees: to2decimals(fees),
                        total: to2decimals(fare + fees)
                    },
                    meta: {
                        range: to2decimals(distance),
                        cruise_speed_kmh: calculateSpeed(inboundOpt.departure_time, inboundOpt.arrival_time, distance),
                        cost_per_km: calculateCost(fare, distance)
                    }
                }
            }
        })

        const combinedOptions = []

        outboundOptions.forEach(outboundOpt => {
            inboundOptions.forEach(inboundOpt => {
                const fare = outboundOpt.outbound.price.fare + inboundOpt.inbound.price.fare
                const fees = outboundOpt.outbound.price.fees + inboundOpt.inbound.price.fees
                const combinedOpt = {
                    outbound: outboundOpt.outbound,
                    inbound: inboundOpt.inbound,
                    combinedPrice: {
                        fare: to2decimals(fare),
                        fees: to2decimals(fees),
                        total: to2decimals(fare + fees)
                    }
                }
                combinedOptions.push(combinedOpt)
            })
        })

        const combinedOptionsAsc = combinedOptions.sort((a, b) => a.combinedPrice.total - b.combinedPrice.total)

        const flights = {
            summary: {
                outbound: outbound.summary,
                inbound: inbound.summary,
              },
              options: combinedOptionsAsc
        }
    
        res.json(flights)
    } catch (error) {
        if (error.name === "AxiosError") {
            return res.status(500).json({message: error.response.data.error})
        }
        res.status(500).json({message: error.message})
    }
}

module.exports = {
    importAirports,
    updateAirportStatus,
    searchFlights
}
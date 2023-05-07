# Flights API
API that returns flight options between airports on certain dates.

## Setup
Steps to run the project locally:
 - Clone the repository to your machine
 - You must stablish a local connection with postgres database then use the code in `airports.sql` file to create the airports table in your database
 - Create a .env file at the root of the project put the structure that you can find on `.env.example` file, updating with the values for them.
 - Run `npm install` to install all dependecies
 - Run `npm run dev` or `node index.js` to start the aplication

## Endpoints
<b>[GET] /importAirports </b> &rarr; Import and update the airports in the database
	
Example request: `https://flights-api.herokuapp.com/importAirports`

<b>[PATCH] /airportStatus/:iata: </b> &rarr; Update the active status for certain airport
- iata - Airport's iata
- active - New desirable status for the airport
	- Must be a boolean type sent in the body(JSON)

Example request: `https://flights-api.herokuapp.com/airportStatus/AAX`

Example body: `{"active" : true }`

<b>[GET] /search/:departure_airport/:arrival_airport/:outbound_date/:inbound_date?</b> &rarr; Returns flight options based on the informed params

- departure_airport - Departure airport iata
- arrival_airport - Arrival airport iata
- outbound_date - Outbound date
- inbound_date[Optional] - Inbound date
	- If inbound date is informed, the endpoint will return combined flight options (outbound x inbound) between the informed airports
	 - If inbound date is <b>NOT</b> informed, the endpoint will return just one-way flight options

Example request
`https://flights-api.herokuapp.com/search/POA/MAO/2023-06-06/2023-06-12`

Example response

```
{
   "summary":{
      "outbound":{
         "departure_date":"2023-06-06",
         "from":{
            "iata":"POA",
            "city":"Porto Alegre",
            "lat":-29.98961,
            "lon":-51.17709,
            "state":"RS"
         },
         "to":{
            "iata":"MAO",
            "city":"Manaus",
            "lat":-3.031327,
            "lon":-60.046093,
            "state":"AM"
         },
         "currency":"BRL"
      },
      "inbound":{
         "departure_date":"2023-06-12",
         "from":{
            "iata":"MAO",
            "city":"Manaus",
            "lat":-3.031327,
            "lon":-60.046093,
            "state":"AM"
         },
         "to":{
            "iata":"POA",
            "city":"Porto Alegre",
            "lat":-29.98961,
            "lon":-51.17709,
            "state":"RS"
         },
         "currency":"BRL"
      }
   },
   "options":[
      {
         "outbound":{
            "departure_time":"2023-06-06T06:40:00",
            "arrival_time":"2023-06-06T09:55:00",
            "price":{
               "fare":2111.54,
               "fees":211.15,
               "total":2322.69
            },
            "aircraft":{
               "model":"737-800",
               "manufacturer":"Boeing"
            },
            "meta":{
               "range":3139.85,
               "cruise_speed_kmh":966.11,
               "cost_per_km":0.67
            }
         },
         "inbound":{
            "departure_time":"2023-06-12T14:30:00",
            "arrival_time":"2023-06-12T17:45:00",
            "price":{
               "fare":1703.23,
               "fees":170.32,
               "total":1873.55
            },
            "aircraft":{
               "model":"737-800",
               "manufacturer":"Boeing"
            },
            "meta":{
               "range":3139.85,
               "cruise_speed_kmh":966.11,
               "cost_per_km":0.54
            }
         },
         "combinedPrice":{
            "fare":3814.77,
            "fees":381.47,
            "total":4196.24
         }
      },
      .
      .
      .
   ]
}
```

## Used technologies

<b>node.js and express</b>: Create HTTP based request endpoints for the API</br>
<b>pg and pg-format</b>: Stablish a connection and make queries with postgres database</br>
<b>dotenv</b>: Create enviroment variables to protect sensitive data</br>
<b>axios</b>: Make easier doing third-party http requests

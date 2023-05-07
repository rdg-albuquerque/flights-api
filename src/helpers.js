/**
 * 
 * @param {number} value 
 * @returns {number} A number with 2 decimal points if the value is a float number
 */
const to2decimals = (value) => {
    if (typeof value !== "number") {
        return value
    }

    return (Math.round(value * 100) / 100)
}

/**
 * 
 * @param {string} dateString 
 * @returns {boolean} Return if date is a YYYY-MM-DD format or not
 */
const isValidDate = (dateString) => {
    const regex = /^(?!0000)[0-9]{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[1-2][0-9]|3[0-1])$/
    return regex.test(dateString)
}

/**
 * 
 * @param {number} lat1 Latitude location A
 * @param {number} lon1 Longitude location A
 * @param {number} lat2 Latitude location B
 * @param {number} lon2 Longitude location B
 * @returns {number} Distance between two locations in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
        throw new Error('Make sure the coordinates are correct')
    }

    const earthRadius = 6371 // average radius of Earth in kilometers

    const latDistance = (lat2 - lat1) * Math.PI / 180 // difference in latitude in radians
    const lonDistance = (lon2 - lon1) * Math.PI / 180 // difference in longitude in radians

    const arcsin = Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2)

    const c = 2 * Math.atan2(Math.sqrt(arcsin), Math.sqrt(1 - arcsin)) // angle between the points in radians

    const distance = earthRadius * c // distance in kilometers

    return distance
}


/**
 * 
 * @param {string} departureTime
 * @param {string} arrivalTime
 * @param {number} distance in kilometers
 * @returns speed value in km/h
 */
const calculateSpeed = (departureTime, arrivalTime, distance) => {
    const departureTimestamp = new Date(departureTime).getTime()
    const arrivalTimestamp = new Date(arrivalTime).getTime()

    const duration = (arrivalTimestamp - departureTimestamp) / 3600000 // travel duration in hours

    const kmH = distance / duration

    return to2decimals(kmH)
}

/**
 * 
 * @param {number} price 
 * @param {number} distance 
 * @returns {number} Cost per kilometer
 */
const calculateCost = (price, distance) => {
    return to2decimals(price / distance)
}

module.exports = {
    to2decimals,
    isValidDate,
    calculateDistance,
    calculateSpeed,
    calculateCost
}
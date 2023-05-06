
const checkAuth = (req, res, next) => {
    if (!req.headers.authorization) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
        return res.status(401).json({message: 'Username and password not provided.'})
    }
    const token = req.headers.authorization.split(' ')[1]
    const [username, password] = Buffer.from(token, 'base64').toString().split(':')
    if (username !== process.env.APP_USERNAME || password !== process.env.APP_PASSWORD) {
       return res.status(401).json({message: 'Username or password are invalid.'})
    }
    next()
}

module.exports = {
    checkAuth
}
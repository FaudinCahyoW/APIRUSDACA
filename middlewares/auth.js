const jwt = require('jsonwebtoken')
const User = require('../userModel')

const authenticate = async (req, res, next) =>{
    const token = req.headers.authorization?.split('')[1]

    if(!token){
        return res.status(401).json({message: 'Membutuhkan authentikasi'})
    }

    try{
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY)
        const user = await User.findById(decodedToken.userId)
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" })
        }
        req.user = user;
        next()
    }catch (error){
        res.status(401).json({message: "Token tidak tervalidasi"})
    }
}
module.exports = {authenticate}
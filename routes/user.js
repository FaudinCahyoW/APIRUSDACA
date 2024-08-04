const express = require('express')
const {authenticate} = require("../middlewares/auth")

const router = express.Router()

router.get('/profile', authenticate, (req,res)=>{
    res.json({message:`Selamat datang ${req.user.nama_lengkap}`})
})
module.exports = router
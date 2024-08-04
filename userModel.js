const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema({
    email:String,
    nik: {
        type:String,
        unique:true,
        index:true
    },
    nama_lengkap: String,
    password: String,
    nomor_telepon:String,
    alamat_rumah:String,
    rw: String,
    rt: String
})

UserSchema.pre('save', async function (next){
    const user = this
    if(!user.isModified('password')) return next()

    try{
        const salt = await bcrypt.genSalt()
        user.password = bcrypt.hash(user.password, salt)
        next()
    } catch (error){
        return next(error)
    }
})
UserSchema.methods.comparePassword = async function (password){
    return bcrypt.compare(password, this.password)
}

module.exports = mongoose.model('User', UserSchema)
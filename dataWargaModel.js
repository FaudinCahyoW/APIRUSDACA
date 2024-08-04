const mongoose = require('mongoose')

const TambahSchema = new mongoose.Schema({
    nama_lengkap:String,
    nik:{
        type:String,
        ref:'User'
    },
    rt:String,
    rw:String,
    luas_rumah:String,
    jml_penghuni:String,
    sdia_toilet:String,
    jenis_kmrMandi:String,
    rngka_dinding:String,
    jns_lantai:String,
    status:String

})

module.exports = mongoose.model('Tambah', TambahSchema)
const Tambah = require("../dataWargaModel")
require("dotenv").config();

const tambahData = async (req,res, next) => {
    const {nama_lengkap,
        nik,
        luas_rumah,
        jml_penghuni,
        sdia_toilet,
        jenis_kmrMandi,
        rngka_dinding,
        jns_lantai} = req.body;

    try{
        const tambah = new Tambah({
        nama_lengkap,
        nik,
        luas_rumah,
        jml_penghuni,
        sdia_toilet,
        jenis_kmrMandi,
        rngka_dinding,
        jns_lantai
        })
        await tambah.save()
        res.json({message: "Data anda berhasil disimpan"})
    }catch (error){
        next(error)
    }
}

module.exports = {tambahData};
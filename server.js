const express = require("express");
const bodyParser = require('body-parser')
const cors = require('cors');
const {MongoClient, ObjectId} = require("mongodb")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = 8000;
const app = express();

const url = 'mongodb+srv://cahyofaudin:7520zenthium@restapi.izuejb0.mongodb.net/'
const dbName = 'Node-API'

const userRoutes  = require('./routes/user')
const tambahRoutes = require('./routes/tambahData')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

const config = {
  secret: 'rahasia',
}

app.use(bodyParser.json()); 

app.post('/auth/register', async (req, res, next) => {
  const { email, nik, rt, rw, nama_lengkap, password, nomor_telepon, alamat_rumah } = req.body;

  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const registerCollection = db.collection('users');
    
    const existingEmail = await registerCollection.findOne({ email });
    if (existingEmail) {
      client.close();
      return res.status(401).json({ message: 'Email sudah digunakan' });
    }

    const existingNIK = await registerCollection.findOne({ nik });
    if (existingNIK) {
      client.close();
      return res.status(401).json({ message: 'NIK sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await registerCollection.insertOne({
      email,
      nik,
      nama_lengkap,
      password: hashedPassword,
      nomor_telepon,
      alamat_rumah,
      rt,
      rw
    });

    const token = jwt.sign({ userId: result.insertedId }, process.env.SECRET_KEY);
    res.status(200).send({ token });
    client.close();
  } catch (error) {
    next(error);
  }
});


const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (typeof authHeader!== 'undefined') {
    const bearerToken = authHeader.split(' ')[1]; 
    jwt.verify(bearerToken, process.env.SECRET_KEY, (err, decoded)=>{
      if (err) {
        return res.status(401).json({ message: 'Token tidak valid' });
    }
    req.data= decoded;
    next();
    })
  } else {
    return res.status(403).json({ message: 'Token tidak disediakan.' });
}

};

app.get('/auth/me', verifyToken, async (req, res, next) => {
  try {
    const { userId } = req.data;
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const userCollection = db.collection('users');

    const userData = await userCollection.findOne({ _id: new ObjectId(userId) });
    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const filteredUserData = { ...userData };
    delete filteredUserData.password;

    res.json({ user: filteredUserData });
    client.close();
  } catch (error) {
    next(error);
  }
});


app.post('/auth/login', async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const client = await MongoClient.connect(url)
    const db = client.db(dbName);
    const loginCollection = db.collection('users');
    const user = await loginCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Pengguna tidak ditemukan" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ message: "Password salah, silahkan ulangi" });
    }else{
      //error yg buat lama ada dibawah ini periksa secret keynya kode dibawah memakai env SECRET_KEY & 
      //token yg dikirim harus sesuai dengan baris res.status(200).send({token})
      // fungsi const token itu untuk menandatangani makanya perhatiin secret keynya
      const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {

      });
      res.status(200).send({token})
    }
    client.close();

  } catch (error) {
    next(error);
  }
})

app.get('/data/ambildata/:nik', async (req, res, next) => {
  try {
    const { nik } = req.params;

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const dataCollection = db.collection('dataRumah');

    const dataRumahSehat = await dataCollection.findOne({ nik });

    if (!dataRumahSehat) {
      return res.status(404).json({ message: "Data dengan NIK tersebut tidak ditemukan" });
    }

    res.json({ data: dataRumahSehat });
    client.close();
  } catch (error) {
    next(error);
  }
});



app.get('/data/ambildata', async (req, res, next) => {
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const dataCollection = db.collection('dataRumah');

    // Ambil semua data rumah
    const dataRumahSehat = await dataCollection.find({}).toArray();

    // Kirim respon JSON
    res.json({data : dataRumahSehat});
    client.close();
  } catch (error) {
    next(error);
  }
});



app.put('/data/editdata/:nik', async (req, res, next) => {
  try {
    const { nik } = req.params; // Ambil nik dari params
    const updateData = req.body;

    if (!nik || !updateData) {
      return res.status(400).json({ message: "Missing required fields: nik or update data" });
    }

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const updateCollection = db.collection('dataRumah');

    // Create an update object with $set modifier
    const update = { $set: {} };
    for (const field in updateData) {
      update.$set[field] = updateData[field]; // Add each field-value pair to $set
    }

    const updateResult = await updateCollection.updateOne(
      { nik: nik }, // Ganti _id dengan nik
      update
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ message: 'Data dengan NIK tersebut tidak ditemukan' });
    }

// Calculate status
const updatedData = await updateCollection.findOne({ nik });
const { luas_rumah, jml_penghuni, sdia_toilet, jenis_kmrMandi, rngka_dinding, jns_lantai } = updatedData;

let toilet = sdia_toilet === "ada" ? 100 : 0;
let nilaiJenisKmrMandi = jenis_kmrMandi === "pribadi" ? 100 : 0;
let nilaiRangkaDinding = rngka_dinding === "beton" ? 100 : 0;
let nilaiJnsLantai = (jns_lantai === "keramik" || jns_lantai === "marmer") ? 100 : 0;

const luasRumahInt = parseInt(luas_rumah);
const jmlPenghuniInteger = parseInt(jml_penghuni);
const luasPerOrang = luasRumahInt / jmlPenghuniInteger;

let nilaiLuasPenghawaan = luasPerOrang >= 7.2 ? 100 : 0;
let nilaiLuasJmlPenghuni = (luas_rumah >= 60 && jml_penghuni >= 3) ? 100 : 0;

const rerataNilai = (toilet + nilaiJenisKmrMandi + nilaiRangkaDinding + nilaiJnsLantai + nilaiLuasPenghawaan + nilaiLuasJmlPenghuni) / 6;
const notifikasi = rerataNilai >= 60 ? "Rumah Sehat" : "Rumah Tidak Sehat";

await updateCollection.updateOne(
  { nik: nik },
  { $set: { status: notifikasi } }
);

    res.json({ message: 'Data berhasil diperbarui', notifikasi });
    client.close();
  } catch (error) {
    next(error);
  }
});


app.delete('/data/hapusdata/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const dataCollection = db.collection('dataRumah');

    // Delete data with matching ID
    const deleteResult = await dataCollection.deleteOne({ _id: new ObjectId(id) });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: 'Data dengan ID tersebut tidak ditemukan' });
    }

    res.json({ message: 'Data berhasil dihapus' });
    client.close();
  } catch (error) {
    next(error);
  }
});



app.get('/data/auth', async (req, res, next) => {
  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const dataUserCollection = db.collection('users');

    const dataUser = await dataUserCollection.find({}).toArray();

    res.json({user : dataUser});
    client.close()
  }catch (error){
    next(error)
  }
})

app.get('/data/auth/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const dataCollection = db.collection('users');

    // Find data with matching ID
    const dataAuth = await dataCollection.findOne({ _id: new ObjectId(id) });

    if (!dataAuth) {
      return res.status(404).json({ message: "Data with that ID not found" });
    }

    // Send response with data
    res.json({ user: dataAuth });
    client.close();
  } catch (error) {
    next(error);
  }
});

app.put('/data/editauth/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || !updateData) {
      return res.status(400).json({ message: "Missing required fields: id or update data" });
    }

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const updateCollection = db.collection('users');

    const update = { $set: {} }; 
    for (const field in updateData) {
      update.$set[field] = updateData[field]; 
    }

    const updateResult = await updateCollection.updateOne(
      { _id: new ObjectId(id) },
      update
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ message: 'Data dengan ID tersebut tidak ditemukan' });
    }

    res.json({ message: 'Data berhasil diperbarui' });
    client.close();
  } catch (error) {
    next(error);
  }
});

app.delete('/data/hapusauth/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const dataCollection = db.collection('users');

    const deleteResult = await dataCollection.deleteOne({ _id: new ObjectId(id) });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: 'Data dengan ID tersebut tidak ditemukan' });
    }

    res.json({ message: 'Data berhasil dihapus' });
    client.close();
  } catch (error) {
    next(error);
  }
});

app.post('/data/tambahdata', async (req, res, next) => {
  const { nama_lengkap, nik, luas_rumah, rt, rw, jml_penghuni, sdia_toilet, jenis_kmrMandi, rngka_dinding, jns_lantai, status } = req.body;

  try {
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);
    const userCollection = db.collection('users');
    const dataCollection = db.collection('dataRumah');

    // Validasi nik
    const user = await userCollection.findOne({ nik });
    if (!user) {
      client.close();
      return res.status(404).json({ message: 'Pengguna dengan NIK tersebut tidak ditemukan' });
    }

    // Menentukan nilai input toilet
    let toilet;
    if (sdia_toilet === "ada") {
      toilet = 100;
    } else {
      toilet = 0;
    }

    // Menentukan nilai input jenis_kmrMandi
    let nilaiJenisKmrMandi;
    if (jenis_kmrMandi === "pribadi") {
      nilaiJenisKmrMandi = 100;
    } else {
      nilaiJenisKmrMandi = 0;
    }

    // Menentukan nilai input rngka_dinding
    let nilaiRangkaDinding;
    if (rngka_dinding === "beton") {
      nilaiRangkaDinding = 100;
    } else {
      nilaiRangkaDinding = 0;
    }

    // Menentukan nilai input jns_lantai
    let nilaiJnsLantai;
    if (jns_lantai === "keramik") {
      nilaiJnsLantai = 100;
    } else if (jns_lantai === "marmer") {
      nilaiJnsLantai = 100;
    } else {
      nilaiJnsLantai = 0;
    }

    // Ubah tipe data String menjadi integer
    const luasRumahInt = parseInt(luas_rumah);
    const jmlPenghuniInteger = parseInt(jml_penghuni);

    // Menentukan nilai hasil luas penghawaan
    const luasPerOrang = luasRumahInt / jmlPenghuniInteger;

    // Menentukan nilai hasil luas penghawaan
    let nilaiLuasPenghawaan;
    if (luasPerOrang >= 7.2) {
      nilaiLuasPenghawaan = 100;
    } else {
      nilaiLuasPenghawaan = 0;
    }

    // Menentukan nilai luas_rumah yang di tentukan dari jml_penghuni
    let nilaiLuasJmlPenghuni = 100;
    if (luas_rumah >= 60 && jml_penghuni >= 3) {
      nilaiLuasJmlPenghuni = 100;
    } else {
      nilaiLuasJmlPenghuni = 0;
    }

    // Menghitung rata-rata nilai
    const rerataNilai = (toilet + nilaiJenisKmrMandi + nilaiRangkaDinding + nilaiJnsLantai + nilaiLuasPenghawaan + nilaiLuasJmlPenghuni) / 6;

    // Notifikasi hasil keputusan
    let notifikasi;
    if (rerataNilai >= 60) {
      notifikasi = "Rumah Sehat";
    } else {
      notifikasi = "Rumah Tidak Sehat";
    }

    await dataCollection.insertOne({
      nama_lengkap,
      nik,
      rw,
      rt,
      luas_rumah,
      jml_penghuni,
      sdia_toilet,
      jenis_kmrMandi,
      rngka_dinding,
      jns_lantai,
      status: notifikasi
    });

    client.close();
    res.json({ message: "Data anda berhasil disimpan", notifikasi });
  } catch (error) {
    next(error);
  }
});




app.use('/user', userRoutes)


const  express = require('express')
const {tambahData} = require('../configData/configTambah')

const  router = express.Router();
router.post('/dataWarga', tambahData)

module.exports = router
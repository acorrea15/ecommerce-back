require('dotenv').config();

const mongoose = require('mongoose');

const connectionStr = process.env.MONGODB_URI;


mongoose.connect(connectionStr, {useNewUrlparser: true})
.then(() => console.log('connected to mongodb'))
.catch(err => console.error(err))

mongoose.connection.on('error', err => {
  console.error(err)
})

require('dotenv').config();

const mongoose = require('mongoose');

const connectionStr = process.env.MONGODB_URI;


mongoose.connect("mongodb+srv://adolcor:Peron2531@cluster0.nngzipz.mongodb.net/?retryWrites=true&w=majority", {useNewUrlparser: true})
.then(() => console.log('connected to mongodb'))
.catch(err => console.log(err))

mongoose.connection.on('error', err => { 
  console.log(err)
})

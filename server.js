const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http'); 
require('dotenv').config();
const bcrypt = require("bcryptjs");
const stripe = require('stripe')(process.env.STRIPE_SECRET);
require('./connection')
const sendEmail = require("./utils/sendEmail");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server, {
  /* cors: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PATCH', "DELETE"] */
  cors: '*',
  methods: '*'
})
app.set("view engine", "ejs");

const User = require('./models/User');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const imageRoutes = require('./routes/imageRoutes');

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/images', imageRoutes);


app.post('/create-payment', async(req, res)=> {
  const {amount} = req.body;  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card']
    });
    res.status(200).json(paymentIntent)
  } catch (e) {
    console.log(e.message);
    res.status(400).json(e.message);
   }
})

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    /* Se elimina debido a observación del Jurado: Esto está mal, un bot podría obtener algún mail registrado
    
    const oldUser = await User.findOne({ email });    
    if (!oldUser) {     
      return res.json({ status: "El usuario no existe!!" });
    } */
    
    const secret = JWT_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "2m",
    });
       const link = `http://localhost:8080/reset-password/${oldUser._id}/${token}`;  
    /* const link = `https://ecommerce-back-production.up.railway.app/${oldUser._id}/${token}`; */
    
      const send_to = email;
      const sent_from = process.env.EMAIL_USER;
      const reply_to = email;
      const subject = "ECommerce5i - Restablecimiento de contraseña";
      const message = `
        <h3>Restablecer la contraseña</h3>
        <p>Se ha activado un evento de restablecimiento de contraseña. La ventana de restablecimiento de contraseña está limitada a dos minutos.</p>
      
        <p>Si no restablece su contraseña dentro de dos minutos, deberá enviar una nueva solicitud.</p>
      
        <p>Para completar el proceso de restablecimiento de contraseña, visite el siguiente enlace:</p>
        <ul>
          <li><a href=${link}>${link}</a></li>
        </ul>
          
          
        <p> </p>
        <p>¡Saludos!</p>
      `;
  
      sendEmail(subject, message, send_to, sent_from, reply_to);
      res.status(200).json({ success: true, message: "Email Sent" });
 
  } catch (error) {}
});

app.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;  
  const oldUser = await User.findOne({ _id: id });  
  if (!oldUser) {
    return res.json({ status: "¡Usuario inexistente!. Verifique el email ingresado." });
  }
  const secret = JWT_SECRET + oldUser.password; 

  try {
    const verify = jwt.verify(token, secret);    
    res.render("index", { email: verify.email, status: "¡No verificado!" });    
  } catch (error) {
    console.log(error);
    res.send("¡No verificado!");
  }
});

app.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;
  const oldUser = await User.findOne({ _id: id });

  if (!oldUser) {
    return res.json({ status: "¡Usuario inexistente!. Verifique el email ingresado." });
  }

  const secret = JWT_SECRET + oldUser.password;

  try {   
    const verify = jwt.verify(token, secret);    
    const encryptedPassword = await bcrypt.hash(password, 10);    
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    );
    res.render("index", { email: verify.email, status: "verified" });
  } catch (error) {
    console.log(error);
    res.json({ status: "await User.updateOne" });
  }
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, ()=> {
  console.log(`Servidor corriendo en el puerto ${PORT}`)
})

app.set('socketio', io);

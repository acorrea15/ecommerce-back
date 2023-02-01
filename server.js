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
  console.log(amount);
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


/* app.post("/api/sendemail", async (req, res) => {
  const { email } = req.body;

  try {
    const send_to = email;
    const sent_from = process.env.EMAIL_USER;
    const reply_to = email;
    const subject = "ECommerce5i - Restablecimiento de contraseña";
    const message = `
        <h3>Hola!</h3>
        <p>Para poder reestablecer la contraseña, por favor, haga click en el siguiente link: </p>
        <a href="http://localhost:3000/login/">Restablecer contraseña</a>
       
        <p>Saludos!</p>
    `;

    await sendEmail(subject, message, send_to, sent_from, reply_to);
    res.status(200).json({ success: true, message: "Email Sent" });
  } catch (error) {
    res.status(500).json(error.message);
  }
}); */

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const oldUser = await User.findOne({ email });
    console.log(oldUser, email, "El usuario no existe!!??????????")
    if (!oldUser) {
      console.log(oldUser, email, "El usuario no existe ENTRAAAAA!!!")
      return res.json({ status: "El usuario no existe!!" });
    }
    console.log(oldUser, email, "El usuario no existe222222222!!??????????")
    const secret = JWT_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "2m",
    });
    const link = `http://localhost:8080/reset-password/${oldUser._id}/${token}`;
    console.log(link, "<<<<<----LINK /forgot-password ");


 
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
 

/*     var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "adarsh438tcsckandivali@gmail.com",
        pass: "rmdklolcsmswvyfw",
      },
    });

    var mailOptions = {
      from: "adarsh438tcsckandivali@gmail.com",
      to: "alfredo_adolfoc@hotmail.com",
      subject: "Password Reset",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error, "Error en envío de mail");
      } else {
        console.log("Email sent: " + info.response);
      }
    }); */
    
    //console.log(link);
  } catch (error) {}
});

app.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  console.log(req.params, "<<<---- req.params  app.get(/reset-password/:id/:token");
  const oldUser = await User.findOne({ _id: id });
  console.log(oldUser,  id, "<<<----  oldUser,  id ")
  if (!oldUser) {
    return res.json({ status: "¡Usuario inexistente!. Verifique el email ingresado." });
  }

  console.log(JWT_SECRET, oldUser.password, "JWT_SECRET , oldUser.password")
  const secret = JWT_SECRET + oldUser.password;
  console.log(secret, "secret = JWT_SECRET + oldUser.password")

  try {
    console.log("Antes de verify = jwt.verify(token, secret)")
    const verify = jwt.verify(token, secret);
    console.log("Después de verify = jwt.verify(token, secret)")
    res.render("index", { email: verify.email, status: "¡No verificado!" });
    console.log("render(...........")
  } catch (error) {
    console.log(error);
    res.send("¡No verificado!");
  }
});

app.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const oldUser = await User.findOne({ _id: id });

  console.log(oldUser, "<<<<---- oldUser  app.post(/reset-password/:id/:token");

  if (!oldUser) {
    return res.json({ status: "¡Usuario inexistente!. Verifique el email ingresado." });
  }

  console.log( "antes de secret");

  const secret = JWT_SECRET + oldUser.password;

  console.log(secret, "después de secret");

  try {
    console.log( "antes de verify");
    const verify = jwt.verify(token, secret);
    console.log(verify, "después de verify");
    const encryptedPassword = await bcrypt.hash(password, 10);
    console.log(encryptedPassword, "después de encryptedPassword");
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
    console.log(verify, "antes de render");


    res.render("index", { email: verify.email, status: "verified" });


    console.log(verify, "despuessssssssss de render");
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

const router = require('express').Router();
const User = require('../models/User');
const Order = require('../models/Order');
const jwt = require("jsonwebtoken");
var ls = require('local-storage');
const TOKEN_KEY = "x4TvnErxRETbVcqaLl5dqMI115eNlp5y"; 

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log(authHeader, "Antes del split");
  const token = authHeader && authHeader.split(' ')[1];
  console.log(authHeader, "Después del split");
  console.log(token, "TOKEN!!!!!!!!!!!!")
  if(token==null)
      return res.status(401).send("Token requerido!");
  jwt.verify(token, TOKEN_KEY, (err, user)=>{
      if(err) return res.status(403).send("Token inválido!");
      req.user = user;
      next();
  });
}

// signup
router.post('/signup', async(req, res)=> {
  const {name, email, password} = req.body;

  try {
    const user = await User.create({name, email, password}); 
    res.json(user);
  } catch (e) {
    if(e.code === 11000) return res.status(400).send('El email ya existe! Utilice otro.');
    res.status(400).send(e.message)
  }
})


// login
router.post('/login', async(req, res) => {
  const {email, password} = req.body;
  try {
    const user = await User.findByCredentials(email, password);   
    if(!user.isEnabled) return res.status(400).send('Usuario no habilitado!');
    
    const token = jwt.sign(
      {userId:user._id, 
       userName: user.name,
       userEmail: user.email},
      TOKEN_KEY, 
      {expiresIn: "1h"}
    );

    let nDatos = {...user };
    nDatos = {...nDatos._doc, token};    

    //Setting localStorage Item
    ls.set('token_ecommerce5i', token)     
    console.log(ls.get('token_ecommerce5i'), "<<<--token en local storage-->>>")


    /* console.log(nDatos) */
    res.status(200).json(nDatos);

  } catch (e) {
    res.status(400).send(e.message)
  }
})


// get users;
router.get('/', verifyToken, async(req, res)=> {
  try {
    const users = await User.find({ isAdmin: false }).populate('orders');
    res.json(users);
  } catch (e) {
    res.status(400).send(e.message);
  }
})


// get user orders
router.get('/:id/orders', async (req, res)=> {
  const {id} = req.params;
  try {
    const user = await User.findById(id).populate('orders');
    res.json(user.orders);
  } catch (e) {
    res.status(400).send(e.message);
  }
})


// update user notifcations
router.post('/:id/updateNotifications', async(req, res)=> {
  const {id} = req.params;
  try {
    const user = await User.findById(id);
    user.notifications.forEach((notif) => {
      notif.status = "read"
    });
    user.markModified('notifications');
    await user.save();
    res.status(200).send();
  } catch (e) {
    res.status(400).send(e.message)
  }
})


//Disabled users
router.patch('/:id/mark-disabled', async(req, res)=> {
  const {id} = req.params;
  try {
    const user    = await User.findByIdAndUpdate(id, {isEnabled: false});
    const users = await User.findById(id);
    res.status(200).json(users)
  } catch (e) {
    res.status(400).json(e.message);
  }
})


module.exports = router;

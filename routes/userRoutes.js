const router = require('express').Router();
const User = require('../models/User');
const Order = require('../models/Order');


// signup: conexión con la base de datos para el signup: método post 

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

// login: conexión con la base de datos para el login: post

router.post('/login', async(req, res) => {
  const {email, password} = req.body;
  try {
    const user = await User.findByCredentials(email, password);
    console.log(user,user.isEnabled, "<<<---user")
    if(!user.isEnabled) return res.status(400).send('Usuario no habilitado!');
    res.json(user)
  } catch (e) {
    res.status(400).send(e.message)
  }
})

// get users;

router.get('/', async(req, res)=> {
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

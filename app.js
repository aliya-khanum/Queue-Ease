const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const router = express.Router();
const fs = require('fs');
//const { ObjectId } = require('mongodb');
//const { MongoClient, ObjectId } = require('mongodb');


//n
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express(); 
require('dotenv').config();

const port = process.env.PORT || 3001;







//n



//const app = express();

// MongoDB connection
//mongoose.connect('mongodb://localhost:27017/queueEase');
/*const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    console.log('Uploading to:', uploadPath); // Debug log
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    console.log('File saved as:', uniqueName); // Debug log
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });*/

// // Middleware
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(session({
//   secret: 'your_secret_key',
//   resave: false,
//   saveUninitialized: true,
// }));




const mongoURL = 'mongodb://localhost:27017/queueEase'; // Replace with your database URL
mongoose.connect(mongoURL)
  .then(() => {
    console.log('Connected to MongoDB');
   // db = client.db(dbName);
  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error);
  });
  //n
// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);


//n
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));
//n

// Helper Middleware to Check Authentication
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}
//n

  
//n
// Routes

// // Serve Login Page as Default
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'login.html'));
// });
//n



app.get('/', (req, res) => {
  console.log('Serving login.html');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});



  // Serve the registration page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));


// Handle user registration
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('User already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    req.session.user = { email: newUser.email }; // Log the user in after registration
    res.send('Registration successful! <a href="/">Go to Login</a>');
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).send('Internal Server Error.');
  }
});

// Serve the login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle user login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send('Invalid email or password.');
    }

    req.session.user = { email: user.email }; // Save the user session
    res.redirect('/index'); // Redirect to dashboard
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Internal Server Error.');
  }
});

// Queue Ease Dashboard
app.get('/index', (req, res) => {
  if (!req.session.user) {
    // Redirect to login if not authenticated
    return res.redirect('/');
  }
  // Serve the index.html (main dashboard)
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Middleware to protect routes
function authMiddleware(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// Example protected route
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: `Welcome, ${req.session.userId}` });
});


//n






 // let db;
// Define shop schema
const shopSchema = new mongoose.Schema({
  shopName: String,
  shopAddress: String,
  ownerName: String,
  ownerEmail: String,
  password: String,
  phoneNumber: String,
  utilityBill: String,
  shopPhoto: String,
});
const Shop = mongoose.model('Shop', shopSchema);


// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    cb(null, uploadPath); // Directory for storing uploaded files
  },
  filename: (req, file, cb) => {
   // cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
   const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });



function validateFilePath(filePath) {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error('File does not exist:', filePath);
        return reject(new Error('File not found.'));
      }
      resolve();
    });
  });
}



// Route to get all shops
app.get('/shops', async (req, res) => {
  try {
    const shops = await Shop.find();
    res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).send('Error fetching shops');
  }
});



//n
// Search Shops by Location
app.get('/search-shops', async (req, res) => {
  const { query } = req.query; // Get the search query from request parameters

  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    // Find shops where shopAddress starts with the query (case insensitive)
    const shops = await Shop.find({
      shopAddress: { $regex: `^${query}`, $options: 'i' },
    });

    res.status(200).json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: 'Error searching shops', error });
  }
});
//n
/*
// Route to send files and details to a shop owner via email
app.post('/send-files', upload.single('file'), async (req, res) => {
  try {
    const { shopId, copies, color } = req.body;

    // Validate shopId
    if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).send('Invalid or missing Shop ID');
    }

    // Validate copies
    if (!copies || isNaN(Number(copies)) || Number(copies) <= 0) {
      return res.status(400).send('Invalid or missing copies');
    }

    // Validate color
    if (!color || (color !== 'color' && color !== 'black-and-white')) {
      return res.status(400).send('Invalid color value');
    }

    // Ensure a file was uploaded
    const file = req.file;
    if (!file) {
      return res.status(400).send('File is required');
    }

    // Fetch shop details
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).send('Shop not found');
    }*/
    /*
    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email,
        pass: password
      },
    });

    // Compose the email to the shop owner
    const mailOptions = {
      from: 'khanumaliya03@gmail.com', // Replace with your email
      to: shop.ownerEmail, // Send email to the shop owner's email
      subject: `New Xerox Request from QueueEase`,
      text: `
        You have a new xerox request:
        - Shop: ${shop.shopName}
        - Number of Copies: ${copies}
        - Color: ${color}
      `,
      attachments: [
        {
          filename: file.originalname,
          path: file.path,
        },
      ],
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Delete the uploaded file after sending the email
    fs.unlinkSync(file.path);

    // Respond to the client
    res.status(200).send('File sent successfully to the shop owner!');
  } catch (error) {
    console.error('Error sending file:', error);
    res.status(500).send('Error sending file');
  }
});
*/
// Route to send files and details to a shop owner via email
app.post('/send-files', upload.single('file'), async (req, res) => {

  const filePath = req.file.path;
  try {
    if (!filePath) {
      console.error('File upload failed!');
      return res.status(400).send('File is required');
    }

    await validateFilePath(filePath);
    console.log('File validated:', filePath);



    const { shopId, customerEmail, customerPassword, copies, color } = req.body;

    // Validate inputs
    if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).send('Invalid or missing Shop ID');
    }
    if (!customerEmail || !customerPassword) {
      return res.status(400).send('Customer email and password are required');
    }
    if (!copies || isNaN(Number(copies)) || Number(copies) <= 0) {
      return res.status(400).send('Invalid or missing copies');
    }
    if (!color || (color !== 'color' && color !== 'black-and-white')) {
      return res.status(400).send('Invalid color value');
    }
    const file = req.file;
    if (!file) {
      console.error('File upload failed!');
      return res.status(400).send('File is required');
    }

    // Fetch shop details
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).send('Shop not found');
    }

    const shopOwnerEmail = shop.ownerEmail;

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: customerEmail, // Authenticate as the customer
        pass: customerPassword,
      },
    });

    // Compose the email
    const mailOptions = {
      from: customerEmail, // From the customer's email
      to: shopOwnerEmail, // To the shop owner's email
      subject: `Xerox Request from ${customerEmail}`,
      text: `
        Hello ${shop.shopName},

        A new xerox request has been placed:
        - Customer Email: ${customerEmail}
        - Number of Copies: ${copies} ${copies > 1 ? 'copies' : 'copy'}
        - Color: ${color}

        Please find the attached file below.
      `,
      attachments: [
        {
          filename: file.originalname,
          path: file.path,
        },
      ],
    };

    // Send the email
   await transporter.sendMail(mailOptions);

    // Delete the uploaded file after sending the email
    fs.unlinkSync(file.path);

    // Respond to the client
    console.log('Uploaded file:', req.file);
    res.status(200).send('File sent successfully to the shop owner!');
  } catch (error) {
    console.error('Error sending file:', error);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(500).send('Error sending file');
  }
});




app.get('/shops/:id', async (req, res) => {
 /* const shopId = req.params.id;

  // Validate shopId format
  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    return res.status(400).send('Invalid Shop ID');
  }
*/
/*
const { _id } = req.params;
if (!mongoose.isValidObjectId(_id)) {
  return res.status(400).json({ error: 'Invalid Shop ID format' });
}*/

try {
  // if (!db) {
  //   return res.status(500).json({ error: 'Database not initialized yet' });
  // }

  const shopId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    return res.status(400).json({ error: 'Invalid Shop ID' });
  }


  //const shop = await db.collection('shops').findOne({ _id: new ObjectId(shopId) });
  const shop = await Shop.findById(shopId);
  if (!shop) {
    return res.status(404).json({ error: 'Shop not found' });
  }

  res.json(shop);
} catch (error) {
  console.error('Error fetching shop:', error);
  res.status(500).json({ error: 'Internal Server Error' });
}
}); ``


app.get('/list-shops', async (req, res) => {
  try {
    const shops = await Shop.find();
    res.json(shops);
  } catch (error) {
    console.error('Error fetching shop list:', error);
    res.status(500).send('Error fetching shop list');
  }
});



// Route to add a shop
app.post('/add-shop', upload.fields([
  { name: 'utilityBill', maxCount: 1 },
  { name: 'shopPhoto', maxCount: 1 },
]), async (req, res) => {
  try {
    const {
      shopName,
      shopAddress,
      ownerName,
      ownerEmail,
      password,
      phoneNumber,
    } = req.body;

    const utilityBill = req.files['utilityBill']?.[0]?.filename || null;
    const shopPhoto = req.files['shopPhoto']?.[0]?.filename || null;

    // Create a new shop
    const newShop = new Shop({
      shopName,
      shopAddress,
      ownerName,
      ownerEmail,
      password,
      phoneNumber,
      utilityBill,
      shopPhoto,
    });

    // Save the shop to the database
    await newShop.save();

    // Redirect to the homepage after successful addition
    res.redirect('/index');
  } catch (error) {
    console.error('Error adding shop:', error);
    res.status(500).send('Error adding shop');
  }
});



router.post('/send-file', upload.single('file'), (req, res) => {
  const { email, password } = req.body;
  const filePath = req.file.path;

  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: email, pass: password },
  });

  const mailOptions = {
    from: email,
    to: email,
    subject: 'File from App shop',
    text: 'Please find the attached file.',
    attachments: [{ filename: req.file.originalname, path: filePath }],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Failed to send the email.');
    }

    console.log('Email sent:', info.response);

    fs.unlink(filePath, err => {
      if (err) console.error('Error deleting file:', err);
    });

    res.send('File sent successfully!');
  });
});
module.exports = router;

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please choose a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
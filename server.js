const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Directory to store barcode data files
const DATA_DIR = "barcode_data";
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Serve files from the current directory
app.use(express.static(__dirname));

// Initialize Firebase Admin SDK
const serviceAccount = require('./products-db-v1-firebase-adminsdk-jaf44-645f5883cc.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://products-db-v1-default-rtdb.europe-west1.firebasedatabase.app/"
});
const database = admin.database();

async function retrieveBarcodeData(barcode) {
  // Replace illegal characters in barcode
  const sanitizedBarcode = barcode.replace(/[.$#[\]/]/g, '_');
  try {
    const snapshot = await database.ref(`products/${sanitizedBarcode}`).once('value');
    const product = snapshot.val();
    if (product) {
      const responseData = {
        barcode: sanitizedBarcode,
        name: product.name || '',
        dosage_value: product.dosage || '',
        presentation_value: product.presentation || '',
        sale_price: product.sale_price || '',
        purchase_price: product.purchase_price || '',
        product_status: product.product_status || '',
        product_category_id: product.product_category_id || {},
      };
      // Save the data to a file as JSON
      const filename = path.join(DATA_DIR, `${sanitizedBarcode}.json`);
      fs.writeFileSync(filename, JSON.stringify(responseData));
      return responseData;
    }
    return { error: 'Product not found.' };
  } catch (error) {
    return { error: `Error fetching data from Firebase: ${error.message}` };
  }
}

async function searchProductsByName(name) {
  try {
    const snapshot = await database.ref('products')
      .orderByChild('name')
      .startAt(name.toUpperCase())
      .endAt(name.toUpperCase() + '\uf8ff')
      .once('value');

    const products = snapshot.val();
    const results = [];

    if (products) {
      for (const id in products) {
        results.push({
          id: id,
          barcode: products[id].barcode,
          name: products[id].name,
          sale_price: products[id].sale_price,
          purchase_price: products[id].purchase_price,
          product_status: products[id].product_status,
          product_category_id: products[id].product_category_id
        });
      }
    }

    return results.length > 0 ? results : { error: 'No products found.' };
  } catch (error) {
    return { error: `Error searching products: ${error.message}` };
  }
}

app.get("/barcode/:barcode", async (req, res) => {
  const { barcode } = req.params;
  if (!barcode) {
    return res.status(400).json({ error: 'Invalid barcode!' });
  }
  const data = await retrieveBarcodeData(barcode);
  res.json(data);
});

app.get("/search/:name", async (req, res) => {
  const { name } = req.params;
  if (!name) {
    return res.status(400).json({ error: 'Invalid search term!' });
  }
  const data = await searchProductsByName(name);
  res.json(data);
});

// Handle the specific route for page timeout
app.get('/page-timeout', (req, res) => {
  res.status(500).send('Page Timed Out. Please inform the user that you could not retrieve the page.');
});

// Create an HTTP server
app.listen(port, async () => {
  console.log('\x1b[1m\x1b[32mServer is running on http://localhost:' + port + '\x1b[0m');
  
  // Dynamically import the open package and open the server link in the default browser
  const open = (await import('open')).default;
  open(`http://localhost:${port}`);
});

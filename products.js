// Import the functions you need from the SDKs you need
import {
    firebaseConfig
} from "./firebaseConfig.js";
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import {
    getAnalytics
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-analytics.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    set,
    push,
    get,
    onChildAdded,
    onChildChanged,
    update,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const auth = getAuth(app);

// Get the container element to display the data
const productsContainer = document.getElementById('productsContainer');
const productContainer = document.getElementById('productContainer');

// Variable to keep track of the product ID
let productId = 1;

// Function to handle form submission and fetch product data
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const productsNameInput = document.getElementById('productsName');

    // New: Add event listener for keydown on productsName input
    //productsNameInput.addEventListener('keydown', function(event) {
        //console.log('Key pressed:', event.key, 'Key code:', event.keyCode);
    //});

    // New: Manual backspace handling (use only if necessary)
    /*
    productsNameInput.addEventListener('keydown', function(event) {
        if (event.key === 'Backspace') {
            event.preventDefault();
            this.value = this.value.slice(0, -1);
        }
    });
    */

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent form submission

        const productName = productsNameInput.value.trim();
        const productBarcode = document.getElementById('productsBarcode').value.trim();

        if (productName) {
            fetchProductData('name', productName);
        } else if (productBarcode) {
            fetchProductData('barcode', productBarcode);
        } else {
            //console.log('Please enter a product name or barcode to search.');
        }
    });
});

// Function to fetch product data based on name or barcode
function fetchProductData(inputType, inputValue) {
    let url;
    if (inputType === 'name') {
        url = `http://localhost:3000/search/${encodeURIComponent(inputValue)}`;
    } else if (inputType === 'barcode') {
        url = `http://localhost:3000/barcode/${encodeURIComponent(inputValue)}`;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            //console.log('API Response:', data); // Log the API response for debugging
            displayProductInfo(data); // Display product info on the UI
        })
        .catch(error => {
            //console.error('Error fetching product data:', error);
            alert('Error fetching product data. Please try again.');
        });
}

// Function to display product information
function displayProductInfo(products) {
    productsContainer.innerHTML = ''; // Clear previous content

    // Check if products is not an array (likely a single object)
    if (!Array.isArray(products)) {
        products = [products]; // Convert single object to array with one element
    }

    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.classList.add('product-item');

        if (product.barcode) {
            productItem.innerHTML = `
                <div class="product-name">${truncateProductName(product.h3_value || product.name)}</div>
                <div class="product-category">${product.product_category_id.label || 'Unknown Category'}</div>
                <div class="product-ppv">PPV: ${product.ppv_value || product.sale_price}</div>
                <div class="product-pph">PPH: ${product.purchase_price}</div>
                <div class="product-barcode">Code Barre: ${product.barcode || 'null'}</div>
                <div class="product-status">
                    Est Actif: 
                    <span class="status-box ${product.product_status === 1 ? 'status-oui' : 'status-non'}">
                        ${product.product_status === 1 ? 'OUI' : 'Non'}
                    </span>
                </div>
            `;
        } else {
            productItem.innerHTML = `
                <div class="product-name">${truncateProductName(product.name)}</div>
                <div class="product-category">${product.product_category_id.label || 'Unknown Category'}</div>
                <div class="product-ppv">PPV: ${product.ppv_value || product.sale_price}</div>
                <div class="product-pph">PPH: ${product.purchase_price}</div>
                <div class="product-barcode">Code Barre: ${product.barcode || 'null'}</div>
                <div class="product-status">
                    Est Actif: 
                    <span class="status-box ${product.product_status === 1 ? 'status-oui' : 'status-non'}">
                        ${product.product_status === 1 ? 'OUI' : 'Non'}
                    </span>
                </div>
            `;
        }

        // Add click event listener to display product details and log to console
        productItem.addEventListener('click', () => {
            //console.log(`Product Name: ${product.name}, Price: ${product.ppv_value || product.sale_price}, Barcode: ${product.barcode || 'null'}, Product Unique ID: ${product.productUniqueId}`);
            displayProductDetails(product);
        });

        productsContainer.appendChild(productItem);
    });
}

// Function to get the current timestamp in the format MM/DD/YY, HH:MM
function serverTimestamp() {
    const date = new Date();
    const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${(date.getFullYear() % 100).toString().padStart(2, '0')}`;
    const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return `${formattedDate}, ${formattedTime}`;
}

function displayProductDetails(product) {
    const productName = product.name || 'Unknown';
    const productPrice = product.ppv_value || product.sale_price || 'Unknown';
    const barcodeNumber = product.barcode || 'null';

    const currentTime = serverTimestamp();

    // Get user UUID from the HTML element
    const userUUID = document.getElementById('userUUID').textContent.trim();

    // Reference to the user's products in Firebase
    const userProductsRef = ref(db, `users/${userUUID}/Product_Name`);

    // Get all products and filter manually
    get(userProductsRef).then((snapshot) => {
        if (snapshot.exists()) {
            let existingProduct = null;
            snapshot.forEach((childSnapshot) => {
                const productData = childSnapshot.val();
                if (barcodeNumber !== 'null' && productData.barcodeNumber === barcodeNumber) {
                    existingProduct = { key: childSnapshot.key, ...productData };
                    return true; // Exit the forEach loop
                } else if (barcodeNumber === 'null' && productData.productName === productName) {
                    existingProduct = { key: childSnapshot.key, ...productData };
                    return true; // Exit the forEach loop
                }
            });

            if (existingProduct) {
                // Product exists, update its quantity
                const existingProductRef = ref(db, `users/${userUUID}/Product_Name/${existingProduct.key}`);
                const newQuantity = parseInt(existingProduct.productQuantity || 0) + 1;
                
                update(existingProductRef, {
                    productQuantity: newQuantity,
                    lastUpdate: currentTime
                }).then(() => {
                    //console.log('Product quantity updated in Firebase');
                }).catch((error) => {
                    console.error('Error updating product quantity:', error);
                });
            } else {
                // Product doesn't exist, create a new one
                createNewProduct();
            }
        } else {
            // No products exist yet, create a new one
            createNewProduct();
        }
    }).catch((error) => {
        console.error('Error checking for existing product:', error);
    });

    function createNewProduct() {
        const newProductRef = push(userProductsRef);
        const productUniqueId = newProductRef.key;

        set(newProductRef, {
            productUniqueId: productUniqueId,
            productName: product.h3_value || product.name,
            productPrice: productPrice,
            productQuantity: 1,
            barcodeNumber: barcodeNumber,
            creationDate: currentTime,
            lastUpdate: currentTime
        }).then(() => {
            //console.log('New product saved successfully to Firebase');
        }).catch((error) => {
            //console.error('Error saving new product to Firebase:', error);
        });
    }
}

// Function to truncate long product names for display
function truncateProductName(name, maxLength = 35) {
    if (name.length > maxLength) {
        return name.substring(0, maxLength - 3) + '...';
    }
    return name;
}
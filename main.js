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
    getDatabase,
    ref,
    set,
    push,
    serverTimestamp,
    get,
    onChildAdded,
    update,
    child,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";


// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const db = getDatabase(app);
const auth = getAuth(app);


// Get the container element to display the data
const container = document.getElementById('productContainer');
const checkoutButton = document.getElementById('cash-open-modal');
//const checkoutModal = document.getElementById('cashModal');
const barcodeInputField = document.getElementById('barcodeInput');
const searchButton = document.getElementById('searchButton');
const resetButton = document.getElementById('resetButton');
const cashValueElement = document.getElementById('cashValue');
const soldeValueElement = document.getElementById('soldeValue');
const numberButtons = document.querySelectorAll('.boxButton:not(#backspace)');
const backspaceButton = document.getElementById('backspace');


let userUUID;
let subtotal = 0;
let totalSum = 0;
//let sumValue = 0;
let productId = 1;
let typedNumber = 0;
//let status = "Paid";
let barcodeInput = '';
let barcodeQuantities = {};
let isCheckboxChecked = false;
const checkedClientsData = [];

let sortBy = 'name'; // Default sort by name
let sortAscending = true; // Initialize the sorting order


// Combined mapping for common keyboard layouts
const numKeyMap = {
    '&': '1', 'é': '2', '"': '3', "'": '4', '(': '5',
    '§': '6', 'è': '7', '!': '8', 'ç': '9', 'à': '0',
    '-': '6', '_': '8', // French AZERTY
    ')': '5', // Arabic
};

// Listen for authentication state changes to update userUUID
onAuthStateChanged(auth, (user) => {
    if (user) {
        userUUID = user.uid;

        const productsRef = ref(db, `users/${userUUID}/Product_Name`);

        get(productsRef).then((snapshot) => {
            if (snapshot.exists()) {
                const productData = snapshot.val();
                const productCount = Object.keys(productData).length;
                //console.log(`Total number of products: ${productCount}`);
            } else {
                console.log("No products found.");
            }
        }).catch((error) => {
            console.error("Error getting products: ", error);
        });



        // Function to update product display order based on sorting
        function updateProductOrder() {
            // Get all products from the container
            const products = Array.from(container.children);

            // Sort products based on the current sorting order
            products.sort((a, b) => {
                const nameA = a.querySelector('.box-item.name').innerText.toLowerCase();
                const nameB = b.querySelector('.box-item.name').innerText.toLowerCase();
                const barcodeA = a.querySelector('.box-item.barcode-number').innerText;
                const barcodeB = b.querySelector('.box-item.barcode-number').innerText;
                const priceA = parseFloat(a.querySelector('.box-item.price').innerText);
                const priceB = parseFloat(b.querySelector('.box-item.price').innerText);

                if (sortBy === 'name') {
                    return sortAscending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                } else if (sortBy === 'barcode') {
                    return sortAscending ? barcodeA.localeCompare(barcodeB) : barcodeB.localeCompare(barcodeA);
                } else if (sortBy === 'price') {
                    return sortAscending ? priceA - priceB : priceB - priceA;
                }
            });

            // Remove all products from the container
            container.innerHTML = '';

            // Append sorted products to the container
            products.forEach(productDiv => {
                container.appendChild(productDiv);
            });
        }

        // Function to update sort indicators
        function updateSortIndicators() {
            const indicators = {
                'ItemName': document.getElementById('nameSortIndicator'),
                'BarCode': document.getElementById('barcodeSortIndicator'),
                'Price': document.getElementById('priceSortIndicator')
            };

            for (const [id, indicator] of Object.entries(indicators)) {
                if (sortBy === id.toLowerCase() || (sortBy === 'name' && id === 'ItemName')) {
                    indicator.textContent = sortAscending ? '▲' : '▼';
                } else {
                    indicator.textContent = '▼';
                }
            }
        }

        // Listen for new child added events
        onChildAdded(ref(db, `users/${userUUID}/Product_Name`), (snapshot) => {
            const product = snapshot.val();

            // Convert the timestamps to readable dates
            const creationDate = new Date(product.creationDate).toLocaleDateString('en-US', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit'
            });
            const creationTime = new Date(product.creationDate).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const lastUpdate = new Date(product.lastUpdate).toLocaleDateString('en-US', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit'
            });
            const lastUpdateTime = new Date(product.lastUpdate).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            // Create a div element for the new product
            const productDiv = document.createElement('div');
            productDiv.classList.add('box');
                    productDiv.setAttribute('data-unique-id', product.productUniqueId);

            // Set the innerHTML of the div element with the product details
            productDiv.innerHTML = `
                <div class="box-item">${productId}</div>
                <div class="box-item name">${product.productName}</div>
                <div class="box-item barcode-number">${product.barcodeNumber}</div>
                <div class="box-item price">${product.productPrice}</div>
                <div class="box-item quantity">${product.productQuantity}</div>
                <div class="box-item"></div>
                <div class="box-item created-date">${creationDate}, ${creationTime}</div>
                <div class="box-item updated-date">${lastUpdate}, ${lastUpdateTime}</div>
                <div class="box-item button-container">
                    <button class="small-button edit-button" onclick="editProduct('${product.productUniqueId}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                            <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                        </svg>
                    </button>
                    <button class="small-button delete-button" onclick="deleteXProduct('${product.productUniqueId}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/>
                        </svg>
                    </button>
                </div>
            `;

            // Append the productDiv to the container
            container.appendChild(productDiv);

            // Update the product order based on the current sorting order
            updateProductOrder();

            // Increment the product ID for the next product
            productId++;

            // Add the click event listener to the productDiv
            productDiv.addEventListener('click', function(event) {
                if (event.target.closest('.edit-button') || event.target.closest('.delete-button')) {
                    return; // Do nothing if the click event originated from an "Edit" or "Delete" button
                }
                //console.log(`Product with ID ${product.productUniqueId} clicked`);

                // Retrieve product details from Firebase using the productUniqueId
                const productRef = ref(db, `users/${userUUID}/Product_Name/${product.productUniqueId}`);
                get(productRef).then((snapshot) => {
                    if (snapshot.exists()) {
                        const productDetails = snapshot.val();
                        const barcodeNumber = productDetails.barcodeNumber;
                        const productName = productDetails.productName;
                        const productPrice = productDetails.productPrice;

                        // Call handleBarcode with the retrieved barcode
                        handleBarcode(barcodeNumber, productName);
                    } else {
                        console.log("Product not found.");
                   }
                }).catch((error) => {
                    console.error("Error getting product details: ", error);
                });
            });

            // Style for the productDiv
            productDiv.style.transition = 'background-color 0.3s ease';

            productDiv.addEventListener('mouseover', function() {
                // Change the background color on hover
                productDiv.style.backgroundColor = '#222'; // You can set any color you prefer
            });

            productDiv.addEventListener('mouseout', function() {
                // Restore the original background color when not hovered
                productDiv.style.backgroundColor = ''; // Set to an empty string to use the default background color
            });
        });

        // Event listeners for toggling sort order
        document.getElementById('ItemName').addEventListener('click', function() {
            if (sortBy === 'name') {
                sortAscending = !sortAscending;
            } else {
                sortBy = 'name';
                sortAscending = true;
            }
            updateSortIndicators();
            updateProductOrder();
        });

        document.getElementById('ItemBarcode').addEventListener('click', function() {
            if (sortBy === 'barcode') {
                sortAscending = !sortAscending;
            } else {
                sortBy = 'barcode';
                sortAscending = true;
            }
            updateSortIndicators();
            updateProductOrder();
        });

        document.getElementById('ItemPrice').addEventListener('click', function() {
            if (sortBy === 'price') {
                sortAscending = !sortAscending;
            } else {
                sortBy = 'price';
                sortAscending = true;
            }
            updateSortIndicators();
            updateProductOrder();
        });

        function convertToEnglishNumbers(input) {
            return input.split('').map(char => numKeyMap[char] || char).join('');
        }

        barcodeInputField.addEventListener('input', function() {
            barcodeInput = convertToEnglishNumbers(barcodeInputField.value).replace(/\D/g, '').slice(0, 13);
            barcodeInputField.value = barcodeInput;
            if (barcodeInput.length === 13) {
                handleBarcode(barcodeInput);
                barcodeInput = '';
                barcodeInputField.value = '';
            }
        });

        searchButton.addEventListener('click', function() {
            if (barcodeInput.length === 13) {
                handleBarcode(barcodeInput);
                barcodeInput = '';
                barcodeInputField.value = '';
            }
        });












        
        // Function to truncate text to a maximum of maxLength characters
        function truncateText(text, maxLength) {
            if (text.length > maxLength) {
                return text.substring(0, maxLength) + '...';
            } else {
                return text;
            }
        }

        // Handle barcode function
        function handleBarcode(barcodeNumber, productName) {
            playSuccessSound(); // Play a success sound when a barcode is handled
            let searchMethod, searchValue, endpoint;
        
            // Validate the input
            if (barcodeNumber === null || barcodeNumber === "") {
                alert("Please enter a valid barcode or product name.");
                return;
            }
        
            // Determine the search method and endpoint based on the input
            if (/^\d+$/.test(barcodeNumber)) {
                // Input is numeric, treat as barcode
                searchMethod = 'barcodeNumber';
                searchValue = barcodeNumber;
                endpoint = `http://localhost:3000/barcode/${barcodeNumber}`;
            } else {
                // Input is not numeric, treat as product name
                searchMethod = 'productName';
                searchValue = productName;
                endpoint = `http://localhost:3000/search/${encodeURIComponent(productName)}`;
            }
        
            console.log(`Fetching data from endpoint: ${endpoint}`);
            
            // Query Firebase to find the product based on the search method and value
            const productRef = query(ref(db, `users/${userUUID}/Product_Name`), orderByChild(searchMethod), equalTo(searchValue));
        
            get(productRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const firebaseData = snapshot.val();
                    const productKey = Object.keys(firebaseData)[0];
                    const firebaseProduct = firebaseData[productKey];
                    const firebasePrice = parseFloat(firebaseProduct.productPrice);
        
                    // Make a GET request to the server endpoint
                    fetch(endpoint)
                        .then(response => response.json())
                        .then(data => {
                            // Check if the response contains an error
                            if (data.error) {
                                console.error(data.error);
                                alert("Product not found :(");
                                return;
                            }
        
                            const apiPrice = parseFloat(data.sale_price);
        
                            // Validate the API price
                            if (isNaN(apiPrice)) {
                                console.error('Invalid product price');
                                alert("Invalid product price");
                            } else {
                                let displayedPrice = apiPrice; // Default to API price
                                let priceSource = 'API'; // Default price source
        
                                // Compare with Firebase price if available and different
                                if (!isNaN(firebasePrice) && firebasePrice !== apiPrice) {
                                    console.log(`Firebase price (${firebasePrice}) differs from API price (${apiPrice}). Displaying Firebase price.`);
                                    displayedPrice = firebasePrice;
                                    priceSource = 'Firebase';
                                }
        
                                console.log(`Displayed price: ${displayedPrice} (${priceSource})`);
        
                                // Increment the quantity for the scanned barcode
                                if (barcodeQuantities[data.barcode]) {
                                    barcodeQuantities[data.barcode]++;
        
                                    // Update the quantity in the existing productInfoDiv if it exists
                                    const existingProductInfoDiv = document.querySelector(`.product-info[data-barcode="${data.barcode}"]`);
        
                                    if (existingProductInfoDiv) {
                                        const quantitySpan = existingProductInfoDiv.querySelector('.quantity');
                                        quantitySpan.textContent = barcodeQuantities[data.barcode];
        
                                        subtotal += displayedPrice;
                                    } else {
                                        // Create a new div element to display the product information
                                        const productInfoDiv = document.createElement('div');
                                        productInfoDiv.className = 'product-info';
                                        productInfoDiv.dataset.barcode = data.barcode;
                                        productInfoDiv.style.display = 'block ruby';
        
                                        // Create a minus button
                                        const minusButton = document.createElement('button');
                                        minusButton.textContent = '✘';
                                        minusButton.className = 'minus-button';
        
                                        minusButton.addEventListener('click', handleMinusButtonClick);
        
                                        // Set the content of the new div
                                        productInfoDiv.innerHTML = `
                                            <p>${data.barcode} ⤷ <strong>${displayedPrice} dhs</strong> | ${data.name} | Quantity: <span class="quantity">${barcodeQuantities[data.barcode]}</span></p>
                                        `;
        
                                        productInfoDiv.appendChild(minusButton);
        
                                        document.getElementById('productInfo').appendChild(productInfoDiv);
                                    }
                                } else {
                                    barcodeQuantities[data.barcode] = 1;
        
                                    // Add the product price to the subtotal
                                    subtotal += displayedPrice;
        
                                    // Create a new div element to display the product information
                                    const productInfoDiv = document.createElement('div');
                                    productInfoDiv.className = 'product-info';
                                    productInfoDiv.dataset.barcode = data.barcode;
                                    productInfoDiv.style.display = 'block ruby';
        
                                    // Create a minus button
                                    const minusButton = document.createElement('button');
                                    minusButton.textContent = '✘';
                                    minusButton.className = 'minus-button';
        
                                    minusButton.addEventListener('click', handleMinusButtonClick);
        
                                    // Set the content of the new div
                                    productInfoDiv.innerHTML = `
                                        <p>${data.barcode} ⤷ <strong>${displayedPrice} dhs</strong> | ${data.name} | Quantity: <span class="quantity">${barcodeQuantities[data.barcode]}</span></p>
                                    `;
        
                                    productInfoDiv.appendChild(minusButton);
        
                                    document.getElementById('productInfo').appendChild(productInfoDiv);
                                }
        
                                // Save the scanned barcode and its data to Firebase
                                const barcodeRef = ref(db, 'productBarcodes/' + data.barcode);
                                set(barcodeRef, {
                                    barcode: data.barcode,
                                    productName: data.name,
                                    dosage: data.dosage_value,
                                    presentation: data.presentation_value,
                                    productPrice: data.sale_price
                                }).then(() => {
                                    // Barcode saved successfully
                                }).catch(error => {
                                    console.error('Error saving barcode to Firebase:', error);
                                });
        
                                // Update the displayed information
                                document.getElementById('sub_barcode').textContent = truncateText(data.barcode || "N/A", 35);
                                document.getElementById('sub_productName').textContent = truncateText(data.name, 35);
                                document.getElementById('sub_dosage').textContent = truncateText(data.dosage_value || "N/A", 35);
                                document.getElementById('presentationValue').textContent = truncateText(data.presentation_value || "N/A", 35);
                                document.getElementById('productPrice').textContent = truncateText(displayedPrice.toString(), 35);
                                document.getElementById('sub_subtotalValue').textContent = subtotal.toFixed(2);
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching data from server:', error);
                            alert("Error fetching product data");
                        });
                } else {
                    console.log(`Product ${searchValue} does not exist in Firebase.`);
                    alert("Product not found in stock 😞");
                }
            }).catch((error) => {
                console.error('Error fetching product from Firebase:', error);
            });
        }



        // Function to play the success sound
        function playSuccessSound() {
            const audio = new Audio('barcode.wav');
            audio.play().catch(error => console.log('Error playing sound:', error));
        }        





        function handleMinusButtonClick(event) {
            const productInfoDiv = event.target.parentNode;
            const barcode = productInfoDiv.dataset.barcode;
            const quantitySpan = productInfoDiv.querySelector('.quantity');
            const productPriceElement = productInfoDiv.querySelector('p strong');
            const productPrice = parseFloat(productPriceElement.textContent);

            if (isNaN(productPrice)) {
                console.error('Invalid product price');
            } else {
                // Decrement the quantity for the scanned barcode
                barcodeQuantities[barcode]--;

                // Update the quantity in the productInfoDiv
                quantitySpan.textContent = barcodeQuantities[barcode];

                // Subtract the product price from the subtotal
                subtotal -= productPrice;

                // Check if the quantity is zero, if so, remove the productInfoDiv
                if (barcodeQuantities[barcode] === 0) {
                    productInfoDiv.remove();
                }

                // Update the subtotal value in the product info
                document.getElementById('sub_subtotalValue').textContent = truncateText(subtotal.toFixed(2), 35);

                // Check if there are any remaining product info divs
                const remainingProductInfoDivs = document.querySelectorAll('.product-info');
                if (remainingProductInfoDivs.length === 0) {
                    // If no remaining product info divs, clear the product info
                    resetSubtotal();
                }
            }
        }

        // Reset subtotal function
        function resetSubtotal() {
            subtotal = 0;
            console.log('Subtotal Reset:', subtotal);
            document.getElementById('sub_subtotalValue').textContent = truncateText(subtotal.toFixed(2), 35);
            document.getElementById('sub_barcode').textContent = '';
            document.getElementById('sub_productName').textContent = '';
            document.getElementById('sub_dosage').textContent = '';
            document.getElementById('presentationValue').textContent = '';
            document.getElementById('unitCost').textContent = '';

            // Clear the product info by removing child elements
            const productInfo = document.getElementById('productInfo');
            while (productInfo.firstChild) {
                productInfo.removeChild(productInfo.firstChild);
            }
        }

        checkoutButton.addEventListener('click', function() {
            totalSum = subtotal;
            document.getElementById('sumValue').textContent = totalSum.toFixed(2);
            updateDisplay();
        });

        // Function to update the display and soldeValue
        function updateDisplay() {
            cashValueElement.textContent = (typedNumber / 100).toFixed(2);
            const cashValue = typedNumber / 100;
            const soldeValue = cashValue - subtotal;
            soldeValueElement.textContent = soldeValue.toFixed(2);
            const cashLaterButton = document.getElementById('cashLater');
            const cashButton = document.getElementById('cash-button');
            cashLaterButton.disabled = (soldeValue >= 0);
            cashButton.disabled = (soldeValue < 0);
        }


        // Function to play the error sound
        function playErrorSound() {
            const audio = new Audio('error_sound.mp3');
            audio.play().catch(error => console.log('Error playing sound:', error));
        }

        function handleNumericInput(key) {
            if (cashModal.style.display === 'block' || cashModal.style.display === '') {
                if (key === 'Backspace') {
                    // Remove the last digit from typedNumber
                    typedNumber = Math.floor(typedNumber / 10);
                    cashValueElement.textContent = (typedNumber / 100).toFixed(2);
                    updateDisplay();
                } else {
                   const mappedKey = numKeyMap[key] || key;
                    if (mappedKey >= '0' && mappedKey <= '9') {
                        typedNumber = typedNumber * 10 + parseInt(mappedKey, 10);
                        cashValueElement.textContent = (typedNumber / 100).toFixed(2);
                        updateDisplay();
                    } else {
                        // Change color to red and play error sound
                        cashValueElement.style.color = '#ff5656';
                        playErrorSound();
                        setTimeout(() => {
                            cashValueElement.style.color = 'white';
                        }, 200); // Duration of the red color effect
                    }
                }
            }
        }
        

        numberButtons.forEach(button => {
            button.addEventListener('click', function () {
                const buttonId = button.id;
                typedNumber = typedNumber * 10 + parseInt(buttonId, 10);
                cashValueElement.textContent = (typedNumber / 100).toFixed(2);
                updateDisplay();
            });
        });

        // Add event listener for keyboard input
        document.addEventListener('keydown', function (event) {
            handleNumericInput(event.key);
        });


        // Add event listener for the backspace button
        backspaceButton.addEventListener('click', function () {
            // Remove the last digit from typedNumber
            typedNumber = Math.floor(typedNumber / 10);
            cashValueElement.textContent = (typedNumber / 100).toFixed(2);
            updateDisplay();
        });

        // Initial display update
        updateDisplay();

        // Listen for the reset button click
        resetButton.addEventListener('click', function() {
            resetSubtotal();
        });


        // Get the current timestamp
        const currentTime = serverTimestamp();

        window.editProduct = function(productUniqueId) {
            // Find the corresponding HTML element
            const productDiv = document.querySelector(`[data-unique-id="${productUniqueId}"]`);
            if (productDiv) {
                const productDetails = productDiv.querySelectorAll('.box-item');
                const currentName = productDetails[1].textContent;
                const currentBarcode = productDetails[2].textContent;
                const currentPrice = productDetails[3].textContent;
                const currentQuantity = productDetails[4].textContent;

                // Add the "barcode-number" class to the element that contains the barcode number
                const barcodeNumberElement = productDiv.querySelector('.barcode-number');
                if (barcodeNumberElement) {
                    barcodeNumberElement.classList.add('barcode-number');
                }

                // Populate the edit modal with the current product information
                document.getElementById("newProductName").value = currentName;
                document.getElementById("newBarcode").value = currentBarcode;
                document.getElementById("newPrice").value = currentPrice;
                document.getElementById("newQuantity").value = currentQuantity;

                // Store the productUniqueId for later use
                document.getElementById("saveModal").setAttribute("data-product-unique-id", productUniqueId);

                // Show the edit modal
                document.getElementById("editModal").style.display = "block";
            }
        };

        // Function to save the edited product
        document.getElementById("saveModal").addEventListener("click", function(event) {
            event.preventDefault();
            console.log("Submit button clicked");

            // Get the productUniqueId from the button's data attribute
            const productUniqueId = this.getAttribute("data-product-unique-id");

            // Get the edited data from the input fields
            const newProductName = document.getElementById("newProductName").value;
            const newBarcode = document.getElementById("newBarcode").value;
            const newPrice = document.getElementById("newPrice").value;
            const newQuantity = document.getElementById("newQuantity").value;

            // Update the product in the database using the productUniqueId
            const productRef = ref(db, `users/${userUUID}/Product_Name/${productUniqueId}`);
            update(productRef, {
                productName: newProductName,
                barcodeNumber: newBarcode,
                productPrice: newPrice,
                productQuantity: newQuantity,
                lastUpdate: serverTimestamp(),
            });

            // Find the corresponding HTML element and update it with the new information
            const productDiv = document.querySelector(`[data-unique-id="${productUniqueId}"]`);
            if (productDiv) {
                const productDetails = productDiv.querySelectorAll('.box-item');
                productDetails[1].textContent = newProductName;
                productDetails[2].textContent = newBarcode;
                productDetails[3].textContent = newPrice;
                productDetails[4].textContent = newQuantity;
                productDetails[7].textContent = `${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
            }

            // Close the edit modal
            document.getElementById("editModal").style.display = "none";
        });

        // Function to close the edit modal
        document.getElementById("closeModal").addEventListener("click", function() {
            document.getElementById("editModal").style.display = "none";
        });

        window.deleteXProduct = function(productUniqueId) {
            // Remove the product from the database using the productUniqueId
            const productRef = ref(db, `users/${userUUID}/Product_Name/${productUniqueId}`);
            set(productRef, null);

            // Find the corresponding HTML element and remove it from the page
            const productDiv = document.querySelector(`[data-unique-id="${productUniqueId}"]`);
            if (productDiv) {
                productDiv.remove();
            }
        };

        function checkDuplicateProductName(productName) {
            const productsRef = ref(db, `users/${userUUID}/Product_Name`);
            return get(productsRef).then((snapshot) => {
                const products = snapshot.val();
                for (const key in products) {
                    if (products.hasOwnProperty(key)) {
                        if (products[key].productName === productName) {
                            return true; // Product with the same name already exists
                        }
                    }
                }
                return false; // Product with the same name does not exist
            });
        }

        document.getElementById('submit').addEventListener('click', async function(event) {
            event.preventDefault();
            console.log("Submit button clicked");

            const productName = document.getElementById("productName").value;
            const productBarcode = document.getElementById("productBarcode").value;
            const productPrice = document.getElementById("productPrice").value;
            const productQuantity = document.getElementById("productQuantity").value;

            // Check if the product name is empty
            if (productName.trim() === "") {
                console.log("Product name cannot be empty");
                alert("Product name cannot be empty");
                return;
            }

            // Check if a product with the same name already exists
            const existingProduct = await checkExistingProduct(productName);

            if (existingProduct) {
                // Update the quantity of the existing product
                const newQuantity = parseInt(existingProduct.productQuantity) + 1; // Always increment by 1                

                const updates = {
                    productQuantity: newQuantity,
                    lastUpdate: currentTime
                };

                update(ref(db, `users/${userUUID}/Product_Name/${existingProduct.productUniqueId}`), updates);

                console.log("Product quantity updated");
                playSuccessSound();
                return;
            }

            let barcodeNumber;
            let barcodeDataURL;

            if (productBarcode.trim() === "") {
                // Generate the special number
                barcodeNumber = generatebarcodeNumber(`${productName} - ${productPrice} MAD`);
                const barcodeData = `${barcodeNumber} - ${productName} - ${productPrice} MAD`;

                // Generate the barcode
                const barcodeCanvas = document.createElement('canvas');
                JsBarcode(barcodeCanvas, barcodeNumber.toString(), {
                    format: "CODE128"
                });
                barcodeDataURL = barcodeCanvas.toDataURL();
            } else {
                barcodeNumber = productBarcode;
                barcodeDataURL = ""; // Set an empty value for the barcode data URL
            }

            const productRef = push(ref(db, `users/${userUUID}/Product_Name`));
            const productUniqueId = productRef.key;

            set(productRef, {
                productUniqueId: productUniqueId,
                productName: productName,
                productPrice: productPrice,
                productQuantity: 1, // Start with quantity 1 for new products
                barcode: barcodeDataURL,
                barcodeNumber: barcodeNumber,
                creationDate: currentTime,
                lastUpdate: currentTime
            });

            console.log("New product added");
            playSuccessSound();
        });

        // Function to check for existing product and return it if found
        async function checkExistingProduct(productName) {
            const productsRef = ref(db, `users/${userUUID}/Product_Name`);
            const snapshot = await get(productsRef);

            if (snapshot.exists()) {
                const products = snapshot.val();
                for (const key in products) {
                    if (products[key].productName.toLowerCase() === productName.toLowerCase()) {
                        return {
                            ...products[key],
                            productUniqueId: key
                        };
                    }
                }
            }

            return null;
        }

        function generatebarcodeNumber(data) {
            // Generate a hash of the data using a hashing algorithm
            const hash = hashCode(data);

            // Take the first 8 characters of the hash and convert it to a number
            const barcodeNumber = Math.abs(parseInt(hash.substring(0, 8), 16));

            return barcodeNumber;
        }

        function hashCode(data) {
            let hash = 0;
            if (data.length === 0) {
                return hash;
            }
            for (let i = 0; i < data.length; i++) {
                const char = data.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash.toString(16);
        }













        //-----------------------------------------------------------
        const cashLaterButton = document.getElementById('cashLater');
        const payLaterModel = document.getElementById('payLaterModel');
        const modalContent = document.getElementById('paylaterContainer');
        const checkboxes = [];

        // Add a click event listener to the button
        cashLaterButton.addEventListener('click', function() {
            // Display the "payLaterModel" modal
            payLaterModel.style.display = 'block';

            // Clear the modal content
            modalContent.innerHTML = '';

            // Reference to the Clients data in the database
            const clientsRef = ref(db, `users/${userUUID}/Clients`);

            // Fetch the clients' data
            get(clientsRef)
                .then((snapshot) => {
                    const clientData = snapshot.val();
                    if (clientData) {
                        // Iterate through each client
                        for (const clientId in clientData) {
                            if (Object.hasOwnProperty.call(clientData, clientId)) {
                                const client = clientData[clientId];
                                const firstName = client.name;
                                const lastName = client.lastName;

                                // Create a new div to hold the client information and checkbox
                                const clientDiv = document.createElement('div');
                                clientDiv.classList.add('client-item');

                                // Create a checkbox element
                                const checkbox = document.createElement('input');
                                checkbox.type = 'checkbox';
                                checkbox.classList.add('client-checkbox');

                                // Create a label element for the client's name and last name
                                const label = document.createElement('label');
                                label.textContent = `${firstName} ${lastName}`;
                                label.classList.add('client-name');

                                // Append the checkbox and label to the client div
                                clientDiv.appendChild(checkbox);
                                clientDiv.appendChild(label);

                                // Append the client div to the modal content
                                modalContent.appendChild(clientDiv);

                                // Add the checkbox to the checkboxes array
                                checkboxes.push(checkbox);

                                // Add a click event listener to the checkbox
                                checkbox.addEventListener('click', function() {
                                    isCheckboxChecked = checkboxes.some(cb => cb.checked);

                                    if (checkbox.checked) {
                                        checkboxes.forEach((cb) => {
                                            if (cb !== checkbox) {
                                                cb.disabled = true;
                                            }
                                        });

                                        // Add the checked client data to the array
                                        checkedClientsData.push(clientId);
                                    } else {
                                        checkboxes.forEach((cb) => {
                                            cb.disabled = false;
                                        });

                                        // Remove the unchecked client data from the array
                                        const index = checkedClientsData.indexOf(clientId);
                                        if (index !== -1) {
                                            checkedClientsData.splice(index, 1);
                                        }
                                    }
                                });
                            }
                        }
                    } else {
                        console.log('No client data found.');
                    }
                })
                .catch((error) => {
                    console.error('Error fetching client data: ' + error.message);
                });
        });



        // Add an event listener to the modal close event
        payLaterModel.addEventListener('close', function() {
            // Clear the modal content
            modalContent.innerHTML = '';

            // Enable all checkboxes
            checkboxes.forEach((cb) => {
                cb.disabled = false;
            });
        });



        // Function to handle common tasks
        function handleButtonClick() {
            const sumValue = document.getElementById('sumValue').textContent;
            const soldeValue = document.getElementById('soldeValue').textContent;
            const cashValue = document.getElementById('cashValue').textContent;

            // Generate a random invoice number
            const invoiceNumber = generateInvoiceNumber();
            let lastInvoiceNumber = invoiceNumber;

            // Get the current date and time
            const currentDate = new Date();
            const dateTime = currentDate.toLocaleString();

            // Get a reference to the "Product_Name" location in the database
            const productRef = ref(db, `users/${userUUID}/Product_Name`);

            // Get all the product-info elements
            const productInfoDivs = document.getElementsByClassName('product-info');

            // Create an object to store the invoice data
            const invoicesData = {
                sumValue: sumValue,
                soldeValue: soldeValue,
                cashValue: cashValue,
                dateTime: dateTime
            };

            // Retrieve and print the data from the specified location in the database
            get(productRef).then((snapshot) => {
                const data = snapshot.val();
                //console.log(data);

                // Iterate over each product-info element
                for (let i = 0; i < productInfoDivs.length; i++) {
                    const productInfoDiv = productInfoDivs[i];
                    const productInfoContent = productInfoDiv.innerHTML;

                    try {
                        // Extract the relevant information from the productInfoContent
                        const barcodeMatch = productInfoContent.match(/<p>(.*?) ⤷/);
                        const ppvMatch = productInfoContent.match(/<strong>(.*?) dhs<\/strong>/);
                        const nameMatch = productInfoContent.match(/\| (.*?) \|/);
                        const quantityMatch = productInfoContent.match(/Quantity: <span class="quantity">(\d+)<\/span>/);

                        if (barcodeMatch && ppvMatch && nameMatch && quantityMatch) {
                            const barcode = barcodeMatch[1];
                            const ppv = ppvMatch[1];
                            const name = nameMatch[1];
                            const quantity = parseInt(quantityMatch[1]); // Extracted quantity as an integer

                            if (invoicesData.hasOwnProperty(barcode)) {
                                //
                            } else {
                                // Create a new object for the barcode and store the name, ppv, and quantity
                                const productLocationRef = ref(db, `users/${userUUID}/invoices/${invoiceNumber}/products/${barcode}`);

                                set(productLocationRef, {
                                    name: name,
                                    ppv: ppv,
                                    quantity: quantity
                                });
                            }

                            // Iterate over the data object to match the barcode
                            for (const productUniqueId in data) {
                                if (data.hasOwnProperty(productUniqueId)) {
                                    const productData = data[productUniqueId];
                                    if (productData.barcodeNumber === barcode) {
                                        //console.log('Match found! Product Unique ID:', productUniqueId);

                                        // Go to the specified location in the database
                                        const productLocationRef = ref(db, `users/${userUUID}/Product_Name/${productUniqueId}`);

                                        // Subtract the desired quantity from the productQuantity
                                        let quantityToSubtract = quantity; // You can adjust this value based on your requirements
                                        let updatedProductQuantity = productData.productQuantity;

                                        if (updatedProductQuantity === "" || isNaN(parseInt(updatedProductQuantity))) {
                                            updatedProductQuantity = `-${quantityToSubtract}`;
                                        } else {
                                            updatedProductQuantity = (parseInt(updatedProductQuantity) - quantityToSubtract).toString();
                                        }

                                        // Update the productQuantity in the database
                                        update(productLocationRef, {
                                                productQuantity: updatedProductQuantity
                                            })
                                            .then(() => {
                                                //console.log('Product quantity updated successfully!');

                                                // Find the corresponding HTML element and update it with the new information
                                                const productDiv = document.querySelector(`[data-unique-id="${productUniqueId}"]`);
                                                if (productDiv) {
                                                    const productDetails = productDiv.querySelectorAll('.box-item');
                                                    const quantityElement = productDetails[4];
                                                    if (quantityElement) {
                                                        quantityElement.textContent = updatedProductQuantity;
                                                    }
                                                }
                                            })
                                            .catch((error) => {
                                                console.error('Error updating product quantity:', error);
                                            });

                                        break; // Exit the loop after finding the first match
                                    }
                                }
                            }
                        } else {
                            console.error('Failed to extract information from productInfoContent:', productInfoContent);
                        }
                    } catch (error) {
                        console.error('Error processing productInfoContent:', error);
                    }
                }

                // Print the invoicesData object
                //console.log(invoicesData);
            }).catch((error) => {
                console.error('Error retrieving data:', error);
            });

            // Check if the sumValue is greater than 0
            if (parseFloat(sumValue) > 0) {
                // Reference to the invoice data in the database
                const invoicesRef = ref(db, `users/${userUUID}/invoices/${invoiceNumber}`);

                // Save the invoice data to the database
                set(invoicesRef, invoicesData)
                    .then(() => {
                        // Retrieve the data from the last generated invoice
                        const lastInvoiceRef = ref(db, `users/${userUUID}/invoices/${lastInvoiceNumber}`);

                        // Retrieve data using the query
                        get(lastInvoiceRef)
                            .then((snapshot) => {
                                // Reset the productRows array for each new invoice
                                const productRows = [];
                                const lastInvoiceData = snapshot.val();

                                // Check if lastInvoiceData exists and contains the necessary fields
                                if (lastInvoiceData && lastInvoiceData.cashValue && lastInvoiceData.sumValue && lastInvoiceData.soldeValue && lastInvoiceData.dateTime) {
                                    const cashValue = lastInvoiceData.cashValue;
                                    const sumValue = lastInvoiceData.sumValue;
                                    const soldeValue = lastInvoiceData.soldeValue;
                                    const dateTime = lastInvoiceData.dateTime;

                                    // Check if the "products" field exists in lastInvoiceData
                                    if (lastInvoiceData.products) {
                                        // Iterate over each product in the "products" field
                                        for (const barcode in lastInvoiceData.products) {
                                            if (lastInvoiceData.products.hasOwnProperty(barcode)) {
                                                const productData = lastInvoiceData.products[barcode];

                                                // Now you can access the product data (name, ppv, quantity) for each barcode
                                                const productName = productData.name;
                                                const ppv = productData.ppv;
                                                const quantity = productData.quantity;

                                                // Generate a row for the current product
                                                const productRow = `
                                                    <tr>
                                                        <td class="service">${barcode}</td>
                                                        <td class="desc">${productName}</td>
                                                        <td class="unit">${ppv}</td>
                                                        <td class="qty">${quantity}</td>
                                                        <td class="total">${(ppv * quantity).toFixed(2)} DH</td>
                                                    </tr>
                                                `;

                                                // Add the row to the array
                                                productRows.push(productRow);
                                            }
                                        }
                                    } else {
                                        console.error('No "products" field found in lastInvoiceData.');
                                    }

                                    // Create the invoice content
                                    const invoiceContent = `
                                        <html lang="en">
                                          <head>
                                            <meta charset="utf-8">
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                            <title>Facture #${invoiceNumber}</title>
                                            <script src="jspdf.umd.min.js"></script>
                                            <script src="html2canvas.min.js"></script>
                                            <style>
                                              .clearfix:after {
                                                content: "";
                                                display: table;
                                                clear: both;
                                              }

                                              a {
                                                color: #5D6975;
                                                text-decoration: underline;
                                              }

                                              body {
                                                position: relative;
                                                width: 21cm;
                                                height: 29.7cm;
                                                margin: 0 auto;
                                                color: #001028;
                                                background: #FFFFFF;
                                                font-family: Arial, sans-serif;
                                                font-size: 12px;
                                                font-family: Arial;
                                              }

                                              header {
                                                padding: 10px 0;
                                                margin-bottom: 30px;
                                              }

                                              #logo {
                                                text-align: center;
                                                margin-bottom: 10px;
                                              }

                                              #logo img {
                                                width: 90px;
                                              }

                                              h1 {
                                                border-top: 1px solid  #5D6975;
                                                border-bottom: 1px solid  #5D6975;
                                                color: #5D6975;
                                                font-size: 2.4em;
                                                line-height: 1.4em;
                                                font-weight: normal;
                                                text-align: center;
                                                margin: 0 0 20px 0;
                                                background: url(dimension.png);
                                              }

                                              #project {
                                                float: left;
                                              }

                                              #project span {
                                                color: #5D6975;
                                                text-align: right;
                                                width: 52px;
                                                margin-right: 10px;
                                                display: inline-block;
                                                font-size: 0.8em;
                                              }

                                              #company {
                                                float: right;
                                                text-align: right;
                                              }

                                              #project div,
                                              #company div {
                                                white-space: nowrap;
                                              }

                                              table {
                                                width: 100%;
                                                border-collapse: collapse;
                                                border-spacing: 0;
                                                margin-bottom: 20px;
                                              }

                                              table tr:nth-child(2n-1) td {
                                                background: #F5F5F5;
                                              }

                                              table th,
                                              table td {
                                                text-align: center;
                                              }

                                              table th {
                                                padding: 5px 20px;
                                                color: #5D6975;
                                                border-bottom: 1px solid #C1CED9;
                                                white-space: nowrap;
                                                font-weight: normal;
                                              }

                                              table .service,
                                              table .desc {
                                                text-align: left;
                                              }

                                              table td {
                                                padding: 13px;
                                                text-align: right;
                                              }

                                              table td.service,
                                              table td.desc {
                                                vertical-align: top;
                                              }

                                              table td.unit,
                                              table td.qty,
                                              table td.total {
                                                font-size: 1.2em;
                                              }

                                              table td.grand {
                                                border-top: 1px solid #5D6975;
                                              }

                                              #notices .notice {
                                                color: #5D6975;
                                                font-size: 1.2em;
                                              }

                                              footer {
                                                color: #5D6975;
                                                width: 100%;
                                                height: 30px;
                                                position: absolute;
                                                bottom: 0;
                                                border-top: 1px solid #C1CED9;
                                                padding: 8px 0;
                                                text-align: center;
                                              }

                                              .unit {
                                                width: 30.633px;
                                              }

                                              .qty {
                                                width: 20px;
                                              }

                                              body > main:nth-child(2) > table:nth-child(1) > thead:nth-child(1) > tr:nth-child(1) > th:nth-child(5) {
                                                padding-right: 10px;
                                                padding-left: 60px;
                                              }
                                            </style>
                                            <script>
                                                window.jsPDF = window.jspdf.jsPDF;

                                                function generatePDF() {
                                                  const pdf = new jsPDF();

                                                  const pdfFileName = 'Facture#${invoiceNumber}.pdf';

                                                  const element = document.getElementById('invoice-form');

                                                  html2canvas(element, { scale: 2, dpi: 400 })
                                                    .then(canvas => {
                                                      const imgData = canvas.toDataURL('image/png');
                                                      const pdfWidth = pdf.internal.pageSize.getWidth();
                                                      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                                                      // Add space around the edges (adjust the values as needed)
                                                      const marginX = 5;
                                                      const marginY = 5;

                                                      pdf.addImage(imgData, 'PNG', marginX, marginY, pdfWidth - 2 * marginX, pdfHeight - 2 * marginY);
                                                      pdf.save(pdfFileName);
                                                    });
                                                }
                                            </script>
                                          </head>
                                          <body>
                                            <div id="invoice-form">
                                              <header class="clearfix">
                                                <div id="logo">
                                                  <img src="logo.png" alt="Logo">
                                                </div>
                                                <h1> Facture #${invoiceNumber}</h1>
                                                <div id="company" class="clearfix">
                                                  <div>RZO</div>
                                                  <div>455 Foggy Heights,<br /> AZ 85004, US</div>
                                                  <div>(212) 65195-6794</div>
                                                  <div><a href="mailto:rzotime@gmail.com">rzotime@gmail.com</a></div>
                                                </div>
                                                <div id="project">
                                                  <div><span>PHARMACIE</span> Pharmacie Al Faraj</div>
                                                  <div><span>CLIENT</span> Jihane Chiker</div>
                                                  <div><span>ADDRESS</span> 1440 I6 LOT MASSIRA MG DEROUA, MA</div>
                                                  <div><span>EMAIL</span> <a href="mailto:pharmaciealfaraj2013@gmail.com">pharmaciealfaraj2013@gmail.com</a></div>
                                                  <div><span>DATE</span> ${dateTime}</div>
                                                </div>
                                              </header>
                                              <main>
                                                <table>
                                                  <thead>
                                                    <tr>
                                                      <th class="service">REFERENCE</th>
                                                      <th class="desc">DESCRIPTION</th>
                                                      <th>PRIX</th>
                                                      <th>QTY</th>
                                                      <th>TOTAL</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    ${productRows.join('')}
                                                    <tr>
                                                      <td colspan="4">Cash</td>
                                                      <td class="total">${cashValue} MAD</td>
                                                    </tr>
                                                    <tr>
                                                      <td colspan="4">Solde</td>
                                                      <td class="total">${soldeValue} MAD</td>
                                                    </tr>
                                                    <tr>
                                                      <td colspan="4" class="grand total">TOTAL</td>
                                                      <td class="grand total">${sumValue} MAD</td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                                <div id="notices">
                                                  <div>AVIS:</div>
                                                  <div class="notice">A finance charge of 1.5% will be made on unpaid balances after 30 days.</div>
                                                </div>
                                              </main>
                                              <footer>
                                                La facture a été créée sur un ordinateur et est valable sans signature ni sceau.
                                              </footer>
                                            </div>
                                          </body>
                                          <button onclick="generatePDF()">Generate PDF</button>
                                        </html>
                                    `;

                                    // Open the invoice in a new tab
                                    const newTab = window.open();
                                    newTab.document.write(invoiceContent);
                                    newTab.document.close();
                                    newTab.onload = () => {
                                        newTab.document.querySelector('button').addEventListener('click', generatePDF);
                                    };

                                } else {
                                    console.error('Invalid or missing data in the last invoice.');
                                }
                            })
                            .catch(error => {
                                console.error('Error retrieving last invoice data:', error);
                            });
                    })
                    .catch(error => {
                        console.error('Error saving invoice data to Firebase:', error);
                    });
            }
        }

        const cashButton = document.getElementById('cash-button');
        cashButton.addEventListener('click', handleButtonClick);
        const donePayLaterButton = document.getElementById('DonePayLater');


        donePayLaterButton.addEventListener('click', function() {
            // Close the modal with ID "payLaterModel" only if at least one checkbox is checked
            if (isCheckboxChecked) {
                const payLaterModel = document.getElementById('payLaterModel');
                payLaterModel.style.display = 'none';

                // Log the data of the checked clients
                //console.log('Checked Clients Data:', checkedClientsData);

                // Retrieve the soldeValue from your code
                const soldeValue = document.getElementById('soldeValue').textContent;

                // Iterate through the checked clients array and update solde values in the database
                checkedClientsData.forEach((clientId) => {
                    // Retrieve the existing solde value from the database
                    const clientRef = ref(db, `users/${userUUID}/Clients/${clientId}`);
                    get(clientRef)
                        .then((snapshot) => {
                            const existingData = snapshot.val();
                            let existingSolde = 0;

                            // Check if the solde field exists and is not null or empty
                            if (existingData && existingData.solde !== null && existingData.solde !== undefined && existingData.solde !== "") {
                                existingSolde = parseFloat(existingData.solde) || 0;
                            }

                            const newSolde = existingSolde + parseFloat(soldeValue);

                            // Update the solde value in the database
                            update(clientRef, {
                                    solde: newSolde.toString()
                                })
                                .then(() => {
                                    //console.log(`Solde value updated successfully for client ${clientId}`);

                                    // Find the corresponding HTML element and update it with the new information
                                    const clientDiv = document.querySelector(`[data-unique-id="${clientId}"]`);
                                    if (clientDiv) {
                                        const clientDetails = clientDiv.querySelectorAll('.C-box-item');
                                        clientDetails[4].textContent = newSolde;
                                    }
                                })
                                .catch((error) => {
                                    console.error(`Error updating solde value for client ${clientId}: ${error.message}`);
                                });
                        })
                        .catch((error) => {
                            console.error(`Error retrieving existing data for client ${clientId}: ${error.message}`);
                        });
                });


                // Reset the checked clients array
                checkedClientsData.length = 0;

                // Handle the button click and other tasks if needed
                handleButtonClick();
            }
        });


        // Add event listener to close the modal using the close button
        const payLaterModelCloseButton = document.querySelector('.payLaterModelClose');
        payLaterModelCloseButton.addEventListener('click', function() {
            const payLaterModel = document.getElementById('payLaterModel');
            payLaterModel.style.display = 'none';
        });

        // Reference to the Firebase database
        const updatetotalValueRef = ref(db, `users/${userUUID}/totalValue`);

        // Assuming you have a function to handle the click event on the element with ID "cash-button"
        document.getElementById("cash-button").addEventListener("click", function() {
            // Get the text content of the element with ID "sub_subtotalValue"
            const sub_subtotalValue = document.getElementById('sub_subtotalValue').textContent;

            // Retrieve the current total value from Firebase
            get(updatetotalValueRef).then((snapshot) => {
                // Calculate the new total value by adding the current value and the new value
                const currentTotalValue = snapshot.val() || 0; // default to 0 if there's no existing value
                const newTotalValue = parseFloat(currentTotalValue) + parseFloat(sub_subtotalValue);

                // Store the updated value in Firebase
                set(updatetotalValueRef, newTotalValue).then(() => {
                    //console.log(`Value ${sub_subtotalValue} added. New total: ${newTotalValue}`);

                    // Update the displayed total value rounded to 2 decimal places
                    document.getElementById('totalValue').textContent = newTotalValue.toFixed(2);
                }).catch((error) => {
                    console.error(`Error storing updated value in Firebase: ${error}`);
                });
            }).catch((error) => {
                console.error(`Error retrieving current value from Firebase: ${error}`);
            });
        });

        // Retrieve the total value from Firebase and show it in the console
        const totalValueRef = ref(db, `users/${userUUID}/totalValue`);
        get(totalValueRef)
            .then((snapshot) => {
                const totalValue = snapshot.val() || 0;
                const roundedTotalValue = parseFloat(totalValue).toFixed(2); // Round to 2 decimal places

                // Display the totalValue in the totalValueElement
                document.getElementById('totalValue').textContent = roundedTotalValue;
            })
            .catch(error => {
                console.error('Error retrieving Total Value from Firebase:', error);
            });
    }
});

function generateInvoiceNumber() {
    // Generate a random invoice number
    return Math.floor(Math.random() * 1000000);
}
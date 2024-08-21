// Get the input element
const inputElement = document.getElementById('input-section-scan');

// Function to focus on the input section
function focusOnInput() {
    inputElement.focus();
}

let inputTimer;

// Combined mapping for common keyboard layouts
const numKeyMap = {
    '&': '1', 'é': '2', '"': '3', "'": '4', '(': '5',
    '§': '6', 'è': '7', '!': '8', 'ç': '9', 'à': '0',
    '-': '6', '_': '8',
    ')': '5',
};

// Function to process the input value
function processInput(value) {
    // Apply numKeyMap to the input value
    let processedValue = value.split('').map(char => numKeyMap[char] || char).join('');

    // Clear any existing timer
    clearTimeout(inputTimer);

    // Set a new timer
    inputTimer = setTimeout(() => {
        // Remove any characters that are not alphanumeric
        const alphanumericValue = processedValue.replace(/[^a-zA-Z0-9\-]/g, '');

        // Check if the alphanumericValue is not empty
        if (alphanumericValue.length > 0) {
            // Input is valid, proceed with sending the request
            // Define the API endpoint
            const apiUrl = 'http://localhost:3000/barcode/' + alphanumericValue; // Modify the URL to match your API
            
            // Send a GET request to the API
            fetch(apiUrl)
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Failed to fetch data from the API.');
                    }
                })
                .then(data => {
                    // Check if the barcode is undefined
                    if (data.barcode === undefined) {
                        // Clear the input value
                        inputElement.value = '';
                        // Focus on the input section
                        focusOnInput();
                        // Log the error or show a message
                        console.error('Barcode is undefined.');
                        return;
                    }

                    // Process the response data
                    console.log(data);
                    // Populate the input fields with the JSON data
                    document.getElementById('productBarcode').value = data.barcode;
                    const h3Value = data.h3_value.split(',')[0].trim();
                    document.getElementById('productName').value = h3Value;
                    document.getElementById('productPrice').value = data.ppv_value;
                    document.getElementById('productQuantity').value = '';
                    
                    // Clear the input value
                    inputElement.value = '';
                    
                    // Submit the form
                    document.getElementById('submit').click();
                    
                    // Focus on the input section
                    focusOnInput();
                })
                .catch(error => {
                    console.error('An error occurred:', error);
                });
        } else {
            // Input is empty, you can display an error message or take other actions
            console.error('Invalid input! Please enter an alphanumeric value.');
        }
    }, 300); // Wait for 300ms after the last input before processing
}

// Add an event listener to capture the keydown event
inputElement.addEventListener('keydown', function (event) {
    // Map the key press using numKeyMap
    if (numKeyMap[event.key]) {
        event.preventDefault(); // Prevent the default action
        const processedChar = numKeyMap[event.key];
        this.value += processedChar; // Append the processed character
        processInput(this.value); // Process the updated input value
    }
});

// Add an event listener to capture the input value
inputElement.addEventListener('input', function () {
    processInput(this.value);
});

// Add an event listener for paste events
inputElement.addEventListener('paste', function (e) {
    // Prevent the default paste behavior
    e.preventDefault();
    // Get the pasted text
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    // Apply numKeyMap to the pasted text
    const processedPastedText = pastedText.split('').map(char => numKeyMap[char] || char).join('');
    this.value = processedPastedText; // Update the input value
    // Process the pasted text
    processInput(processedPastedText);
});

// Add event listener to document to refocus on input section when clicking outside
document.addEventListener('click', function (event) {
    if (!inputElement.contains(event.target)) {
        focusOnInput();
    }
});

// Add event listener to document to refocus on input section when right-clicking
document.addEventListener('contextmenu', function () {
    focusOnInput();
});

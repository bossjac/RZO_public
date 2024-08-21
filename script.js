import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
    if (user) {
        const emailUser = document.getElementById('userEmail');
        //emailUser.textContent = `${user.email}`;
    } else {
        window.location.href = "sign.html";
    }
});

// Add event listener for logout button
const logoutButton = document.getElementById('logout-button');
logoutButton.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            window.location.href = "sign.html";
        })
        .catch((error) => {
            console.error("Error Logging user out", error);
        });
});




// Get the button and modal elements
const createProductsBtn = document.getElementById('small-button');
const clientsBtn = document.getElementById('clientsBtn');
const barcodeBtn = document.getElementById('barcode-scan');
const cashBtn = document.getElementById('cash-open-modal');
const cashLaterBtn = document.getElementById('cashLater');
const ordersBtn = document.getElementById('ordersBtn');


const modal = document.getElementById('modal');
const cmodal = document.getElementById('C-modal');
const barcodemodal = document.getElementById('barcodeScanModal');
const cashmodal = document.getElementById('cashModal');
const paylatermodel = document.getElementById('payLaterModel');
const pmodal = document.getElementById('P-modal');


const closeBtn = document.querySelector('.close');
const ccloseBtn = document.querySelector('.C-close');
const barcodecloseBtn = document.querySelector('.barcodeclose');
const cashcloseBtn = document.querySelector('.cashClose');
const paylatercloseBtn = document.querySelector('.payLaterModelClose');
const pcloseBtn = document.querySelector('.P-close');


// Events listener for the close/open button
createProductsBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);

// Event listener for the clients close/open button
clientsBtn.addEventListener('click', openClientsModal);
ccloseBtn.addEventListener('click', closeClientsModal);

barcodeBtn.addEventListener('click', openBarcodeModal);
barcodecloseBtn.addEventListener('click', closeBarcodeModal);

cashBtn.addEventListener('click', openCashModal);
cashcloseBtn.addEventListener('click', closeCashModal);

cashLaterBtn.addEventListener('click', openCashLaterModal);
paylatercloseBtn.addEventListener('click', closeCashLaterModal);



ordersBtn.addEventListener('click', openProductsModal);
pcloseBtn.addEventListener('click', closeProductsModal);






// Function to open the modal
function openModal() {
    modal.style.display = 'block';
}

// Function to close the modal
function closeModal() {
    modal.style.display = 'none';
}

//------------------------------------------

function openClientsModal() {
    cmodal.style.display = 'block';
}

function closeClientsModal() {
    cmodal.style.display = 'none';
}

//------------------------------------------

function openBarcodeModal() {
    barcodemodal.style.display = 'block';
    barcodemodal.style.zIndex = '9999'; // Set a higher z-index value
}

function closeBarcodeModal() {
    barcodemodal.style.display = 'none';
    barcodemodal.style.zIndex = '';
}

//------------------------------------------

function openCashModal() {
    cashmodal.style.display = 'block';
}

function closeCashModal() {
    cashmodal.style.display = 'none';
}

//-------------------------------------------

function openCashLaterModal() {
    paylatermodel.style.display = 'block';
    barcodemodal.style.zIndex = '9999';
}

function closeCashLaterModal() {
    paylatermodel.style.display = 'none';
    barcodemodal.style.zIndex = '';
}

//-------------------------------------------

function openProductsModal() {
    pmodal.style.display = 'block';
}

function closeProductsModal() {
    pmodal.style.display = 'none';
}


// Hide the modals initially
modal.style.display = 'none';
cmodal.style.display = 'none';
barcodemodal.style.display = 'none';
cashmodal.style.display = 'none';
paylatermodel.style.display = 'none';
pmodal.style.display = 'none';


// Dark mode functionality
const darkModeBtn = document.getElementById('darkModeBtn');
const body = document.body;
const isDarkMode = localStorage.getItem('darkMode');

if (isDarkMode === 'true') {
    body.classList.add('dark-mode');
}

darkModeBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode.toString());
});

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
    update
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    const userUUIDElement = document.getElementById('userUUID');

    // Listen for authentication state changes to update userUUID
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userUUID = user.uid;
            //console.log("Html userUUID:", userUUID);
            userUUIDElement.textContent = `${userUUID}`;
        } else {
            console.log("No user is signed in.");
            userUUIDElement.textContent = 'No user is signed in.';
        }
    });
});

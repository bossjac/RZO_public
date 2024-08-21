import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import {
    getAnalytics
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-analytics.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    signOut
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";
import {
    firebaseConfig
} from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

let userUUID;

console.log("Firebase initialized.");

setPersistence(auth, browserLocalPersistence)
    .then(() => {
        const signupForm = document.getElementById('signup-form');
        const loginForm = document.getElementById('login-form');

        // Handle SignUp Event
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const button = document.getElementById('signup-button');
            const buttonText = button.querySelector('.button-text');
            const loadingAnimation = button.querySelector('.lds-dual-ring');

            // Show loading animation, hide button text
            buttonText.style.display = 'none';
            loadingAnimation.style.display = 'inline-block';

            // Log out the current user
            signOut(auth)
                .then(() => {
                    // Proceed with signing up a new user
                    createUserWithEmailAndPassword(auth, email, password)
                        .then((userCredential) => {
                            userUUID = userCredential.user.uid;
                            window.location.href = "index.html";
                        })
                        .catch((error) => {
                            // Handle signup error
                            console.log("Error during signup:", error);
                            if (error.code === "auth/email-already-in-use") {
                                document.getElementById("signup-error").textContent = "Email is already in use. Please use a different email.";
                            } else if (error.code === "auth/weak-password") {
                                document.getElementById("signup-error").textContent = "Password should be at least 6 characters.";
                            } else {
                                document.getElementById("signup-error").textContent = "Signup failed. Please check your credentials and try again.";
                            }
                        })
                        .finally(() => {
                            // Hide loading animation, show button text
                            buttonText.style.display = 'inline-block';
                            loadingAnimation.style.display = 'none';
                        });
                })
                .catch((error) => {
                    console.log("Error during logout:", error);
                    // Hide loading animation, show button text
                    buttonText.style.display = 'inline-block';
                    loadingAnimation.style.display = 'none';
                });
        });

        // Handle Login Event
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const button = document.getElementById('login-button');
            const buttonText = button.querySelector('.button-text');
            const loadingAnimation = button.querySelector('.lds-dual-ring');

            // Show loading animation, hide button text
            buttonText.style.display = 'none';
            loadingAnimation.style.display = 'inline-block';

            // Log out the current user
            signOut(auth)
                .then(() => {
                    // Proceed with logging in a new user
                    signInWithEmailAndPassword(auth, email, password)
                        .then((userCredential) => {
                            userUUID = userCredential.user.uid;
                            window.location.href = "index.html";
                        })
                        .catch((error) => {
                            // Handle login error
                            document.getElementById("login-error").textContent = "Login failed. Please check your credentials and try again.";
                            console.log("Error during login:", error);
                        })
                        .finally(() => {
                            // Hide loading animation, show button text
                            buttonText.style.display = 'inline-block';
                            loadingAnimation.style.display = 'none';
                        });
                })
                .catch((error) => {
                    console.log("Error during logout:", error);
                    // Hide loading animation, show button text
                    buttonText.style.display = 'inline-block';
                    loadingAnimation.style.display = 'none';
                });
        });
    })
    .catch((error) => {
        console.log("Error setting user persistence:", error);
    });
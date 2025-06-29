export const environment = {
  production: false,
  useMockOTP: false, // Set to false to use real Firebase phone authentication
  bypassPhoneVerification: true, // TEMPORARY: Bypass phone verification for forgot password
  firebase: {
    apiKey: "AIzaSyDfd3IrS0suW7oVGxH7xOcD_sPZv0kyUg4",
    authDomain: "clean-cut-4c327.firebaseapp.com",
    projectId: "clean-cut-4c327",
    storageBucket: "clean-cut-4c327.firebasestorage.app",
    messagingSenderId: "143771004011",
    appId: "1:143771004011:web:8915eaa1b261827325952e"
  }
};
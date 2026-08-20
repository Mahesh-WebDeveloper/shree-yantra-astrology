// Keep the vendor package behind a JS boundary: it publishes TypeScript source
// written for an older compiler, while this app uses strict TypeScript 5.9.
module.exports = require('@msg91comm/sendotp-react-native');

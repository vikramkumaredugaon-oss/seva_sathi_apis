const twilio = require('twilio');
const account_SID ="AC016671c6a9f1d2c0752f294b265058c2";
const auth_token = "8b735759314a1e2c28a9dc9308a8f875";
const service_id = "VAe6a4cabe6cde546c0229c59b0e7ffa00";
const client = twilio(account_SID,auth_token);
module.exports = {client,service_id};
const twilio = require('twilio');
const account_SID = process.env.ACCOUNT_SID;
const auth_token = process.env.AUTH_TOKEN;
const service_id = process.env.SERVICE_ID;
const client = twilio(account_SID,auth_token);
module.exports = {client,service_id};
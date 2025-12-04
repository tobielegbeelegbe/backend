const request = require("request");

class SmsService {
  constructor() {
    this.apiKey =
      process.env.TERMII_API_KEY ||
      "TLkRwoqVGUpzTdsffRGPjilxXvEqVXeElcfqpYWlNXYeyFOSZyvNIqtIJBNHLb";
    this.senderId = "GreyFundr";
  }

  async send({ to, message }) {
    const payload = {
      to,
      from: this.senderId,
      sms: message,
      type: "plain",
      api_key: this.apiKey,
      channel: "generic",
    };

    return new Promise((resolve, reject) => {
      request(
        {
          method: "POST",
          url: "https://api.ng.termii.com/api/sms/send",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        (err, response) => {
          if (err) return reject(err);
          resolve(response.body);
        }
      );
    });
  }
}

module.exports = new SmsService();

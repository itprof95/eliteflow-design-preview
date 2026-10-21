// Recipient approved by the user. Keep automatic delivery paused until the
// inbox owner activates the form and a test email with an attachment is received.
// No Gmail password or API key belongs in this browser file.
window.ELITEFLOW_CONFIG = Object.freeze({
  siteBasePath: "/eliteflow-design-preview/",
  requestEndpoint: "",
  emailDelivery: Object.freeze({
    provider: "FormSubmit",
    recipient: "Liteflowservices@gmail.com",
    endpoint: "https://formsubmit.co/Liteflowservices@gmail.com",
    verified: false
  })
});

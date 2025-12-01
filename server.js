require("dotenv").config();

const express = require("express");
const path = require("path");
const sequelize = require("./Config/sequalize_db");

const app = express();
const PORT = process.env.PORT || 3000;

const globalErrorHandler = require("./helpers/globalErrorHandler");

const userRoute = require("./Routes/endpoints/user");
const authRoute = require("./Routes/endpoints/auth");
const adminRoute = require("./Routes/endpoints/admin");
const backerRoute = require("./Routes/endpoints/backer");
const donorRoute = require("./Routes/endpoints/donations");
const campaignRoute = require("./Routes/endpoints/campaigns");
const championRoute = require("./Routes/endpoints/champion");
const followerRoute = require("./Routes/endpoints/follower");
const walletRoute = require("./Routes/endpoints/wallets");
const splitBillRoute = require("./Routes/endpoints/splitbill");
const notificationRoutes = require("./Routes/endpoints/notifications");
const uploadRoute = require("./Routes/endpoints/upload");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use("/users", userRoute);
app.use("/auth", authRoute);
app.use("/admin", adminRoute);
app.use("/backer", backerRoute);
app.use("/donor", donorRoute);
app.use("/campaign", campaignRoute);
app.use("/champion", championRoute);
app.use("/follower", followerRoute);
app.use("/wallet", walletRoute);
app.use("/split-bill", splitBillRoute);
app.use("/notifications", notificationRoutes);
app.use("/upload", uploadRoute);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "main.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/createcampaign", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "campaign.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.use(globalErrorHandler);

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    console.log(
      "⚠️ Use migrations for schema changes: npx sequelize-cli db:migrate"
    );

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
};

startServer();

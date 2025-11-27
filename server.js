const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

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

const path = require("path");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/notifications", notificationRoutes);
app.use(express.static(path.join(__dirname, "public")));

app.use("/users", userRoute);
app.use(express.static(path.join(__dirname, "public")));

app.use("/split-bill", splitBillRoute);
app.use(express.static(path.join(__dirname, "public")));

app.use("/auth", authRoute);
app.use(express.static(path.join(__dirname, "public")));

app.use("/wallet", walletRoute);
app.use(express.static(path.join(__dirname, "public")));

app.use("/donor", donorRoute);
app.use(express.static(path.join(__dirname, "public")));

app.use("/follower", followerRoute);
app.use(express.static(path.join(__dirname, "public")));

app.use("/champion", championRoute);
app.use(express.static(path.join(__dirname, "public")));

app.use("/campaign", campaignRoute);
app.use(express.static(path.join(__dirname, "public")));

app.use("/admin", adminRoute);
app.use(express.static(path.join(__dirname, "public")));

app.use("/backer", backerRoute);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "main.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/createcampain", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "campaign.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

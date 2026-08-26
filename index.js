const express = require('express');
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const doctorsRoutes = require('./routes/doctorsRoutes')
const specialtyRoutes = require('./routes/specialtyRoutes')
const credentialRoutes = require('./routes/credentialRoutes')
const profileRoutes = require('./routes/profileRoutes')

let app = express();
const port = 4000;
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/doctors", doctorsRoutes);
app.use("/specialties", specialtyRoutes);
app.use("/credentials", credentialRoutes);
app.use(
    "/uploads",
    express.static("uploads")
);
app.use("/profile", profileRoutes);

app.listen(port, () => {
    console.log(`app is running on port: ${port}`);
});

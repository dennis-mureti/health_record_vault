const express = require("express");
const router = express.Router();

// Example protected route
router.get("/", (req, res) => {
  res.json({ message: "Settings route working" });
});

module.exports = router;

const { Router } = require("express");

const router = Router();

// Authentication Middlewares

// CREATE
router.post("/", async (req, res, next) => {});

// READ
router.get("/:id", (req, res) => {
  // Try to delete plan from given id contained inside req.params
  // If not existing raise error
});

// UPDATE
router.patch("/:id", (req, res) => {
  // Try to update plan with id and plan contained inside req.params & req.body respectively
  // If not existing raise error
});

// DELETE
router.delete("/:id", (req, res) => {
  // Try to delete plan with id contained inside req.param
  // If not existing raise error
});

module.exports = router;

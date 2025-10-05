const express = require('express');
const PasswordController = require('../controllers/passwordController');

const router = express.Router();
const passwordController = new PasswordController();

// Password routes
router.get('/', (req, res, next) => passwordController.getPasswords(req, res, next));
router.post('/', (req, res, next) => passwordController.createPassword(req, res, next));
router.put('/:id', (req, res, next) => passwordController.updatePassword(req, res, next));
router.delete('/:id', (req, res, next) => passwordController.deletePassword(req, res, next));

module.exports = router;

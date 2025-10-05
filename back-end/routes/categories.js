const express = require('express');
const CategoryController = require('../controllers/categoryController');

const router = express.Router();
const categoryController = new CategoryController();

// Category routes
router.get('/', (req, res, next) => categoryController.getCategories(req, res, next));
router.post('/', (req, res, next) => categoryController.createCategory(req, res, next));
router.put('/:id', (req, res, next) => categoryController.updateCategory(req, res, next));
router.delete('/:id', (req, res, next) => categoryController.deleteCategory(req, res, next));
router.post('/initialize', (req, res, next) => categoryController.initializeCategories(req, res, next));

module.exports = router;

const express = require('express');
const PasswordService = require('../services/passwordService');

const router = express.Router();
const passwordService = new PasswordService();

// User stats route
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    console.log('📊 User stats requested for:', userId);
    
    const stats = await passwordService.getUserStats(userId);
    console.log('📊 User stats generated for:', userId);
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Error generating user stats:', error);
    next(error);
  }
});

module.exports = router;

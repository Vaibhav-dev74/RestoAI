import express from 'express';

const router = express.Router();

router.post('/register/initiate-email', (req, res) => {
  res.json({ test: 'works' });

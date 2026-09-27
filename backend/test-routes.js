import express from 'express';

const app = express();

// Test each route file individually
console.log('Testing auth routes...');
try {
  const authRoutes = await import('./routes/auth.js');
  app.use('/api/auth', authRoutes.default);
  console.log('✅ Auth routes loaded successfully');
} catch (err) {
  console.error('❌ Auth routes failed:', err.message);
}

console.log('Testing order routes...');
try {
  const orderRoutes = await import('./routes/order.js');
  app.use('/api/orders', orderRoutes.default);
  console.log('✅ Order routes loaded successfully');
} catch (err) {
  console.error('❌ Order routes failed:', err.message);
}

console.log('Testing AI routes...');
try {
  const aiRoutes = await import('./routes/ai.js');
  app.use('/api/ai', aiRoutes.default);
  console.log('✅ AI routes loaded successfully');
} catch (err) {
  console.error('❌ AI routes failed:', err.message);
}

console.log('Testing table routes...');
try {
  const tableRoutes = await import('./routes/tables.js');
  app.use('/api/tables', tableRoutes.default);
  console.log('✅ Table routes loaded successfully');
} catch (err) {
  console.error('❌ Table routes failed:', err.message);
}

console.log('Testing whatsapp routes...');
try {
  const whatsappRoutes = await import('./routes/whatsapp.js');
  app.use('/api/whatsapp', whatsappRoutes.default);
  console.log('✅ WhatsApp routes loaded successfully');
} catch (err) {
  console.error('❌ WhatsApp routes failed:', err.message);
}

console.log('Testing attendance routes...');
try {
  const attendanceRoutes = await import('./routes/attendance.js');
  app.use('/api/attendance', attendanceRoutes.default);
  console.log('✅ Attendance routes loaded successfully');
} catch (err) {
  console.error('❌ Attendance routes failed:', err.message);
}

console.log('Testing inventory routes...');
try {
  const inventoryRoutes = await import('./routes/inventory.js');
  app.use('/api/inventory', inventoryRoutes.default);
  console.log('✅ Inventory routes loaded successfully');
} catch (err) {
  console.error('❌ Inventory routes failed:', err.message);
}

app.listen(3001, () => console.log('Test server on port 3001'));

import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  itemsSupplied: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }],
  priceList: [{
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    price: { type: Number }
  }]
});

export default mongoose.model('Supplier', supplierSchema); 
import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  quantity: { type: Number, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  status: { type: String, enum: ['pending', 'sent', 'confirmed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  sentAt: { type: Date }
});

export default mongoose.model('PurchaseOrder', purchaseOrderSchema); 
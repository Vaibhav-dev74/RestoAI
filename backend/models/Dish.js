import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  ingredients: [{ type: String }],
  recipeItems: [
    {
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
      quantity: { type: Number, required: true, min: 0 },
      unit: {
        type: String,
        enum: ['kg', 'liters', 'pieces', 'gms', 'ml', 'packs'],
        default: 'pieces',
      },
    },
  ],
  price: { type: Number, required: true },
  image: { type: String }, // URL or path
  category: { type: String }, // e.g., 'Starter', 'Main', 'Dessert', etc.
  dietary: [{ type: String }], // e.g., ['Vegetarian', 'Vegan', 'Gluten-Free']
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Dish', dishSchema); 
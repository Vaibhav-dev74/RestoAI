import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  cost: { type: Number, required: true },
  price: { type: Number, required: true },
  margin: { type: String } // in percentage (e.g., "35.71")
});

export default mongoose.model('Recipe', recipeSchema);

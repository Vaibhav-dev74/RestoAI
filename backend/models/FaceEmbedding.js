import mongoose from 'mongoose';

const faceEmbeddingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    modelName: {
      type: String,
      default: 'VGG-Face',
    },
    embedding: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
);

faceEmbeddingSchema.index({ user: 1, restaurant: 1 }, { unique: true });

export default mongoose.model('FaceEmbedding', faceEmbeddingSchema);

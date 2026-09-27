// scripts/seedRestaurants.js
import mongoose from 'mongoose';
import Restaurant from '../models/Restaurant.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleRestaurants = [
  {
    name: "The Spice Garden",
    address: "123 MG Road, Kalyan West, Mumbai - 421301",
    location: {
      latitude: 19.265929,
      longitude: 73.238978,
      city: "Kalyan",
      area: "MG Road",
      pincode: "421301"
    },
    coordinates: {
      type: "Point",
      coordinates: [73.238978, 19.265929]
    },
    cuisine: ["North Indian", "Mughlai", "Chinese"],
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    phone: "+91 9876543210",
    email: "contact@spicegarden.com",
    isOpen: true,
    isVeg: false,
    deliveryTime: 35,
    avgPrice: 450,
    offers: [
      {
        text: "50% off up to ₹150",
        code: "SPICE50",
        discount: 50,
        validUntil: new Date("2024-12-31")
      }
    ]
  },
  {
    name: "Pizza Paradise",
    address: "MIDC Road, Kalyan East - 421306",
    location: {
      latitude: 19.262929,
      longitude: 73.242978,
      city: "Kalyan",
      area: "MIDC",
      pincode: "421306"
    },
    coordinates: {
      type: "Point",
      coordinates: [73.242978, 19.262929]
    },
    cuisine: ["Italian", "Fast Food", "Pizza"],
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
    phone: "+91 9876543211",
    email: "hello@pizzaparadise.com",
    isOpen: true,
    isVeg: true,
    deliveryTime: 30,
    avgPrice: 600,
    offers: [
      {
        text: "Free delivery on orders above ₹300",
        code: "FREEDEL",
        discount: 100,
        validUntil: new Date("2024-12-31")
      }
    ]
  },
  {
    name: "Biryani Blues",
    address: "Shahad Station Road, Kalyan - 421301",
    location: {
      latitude: 19.257929,
      longitude: 73.233978,
      city: "Kalyan",
      area: "Shahad",
      pincode: "421301"
    },
    coordinates: {
      type: "Point",
      coordinates: [73.233978, 19.257929]
    },
    cuisine: ["Biryani", "Hyderabadi", "Mughlai"],
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
    phone: "+91 9876543212",
    email: "order@biryaniblues.com",
    isOpen: true,
    isVeg: false,
    deliveryTime: 40,
    avgPrice: 500,
    offers: []
  },
  {
    name: "South Indian Cafe",
    address: "Mharal Village, Kalyan - 421301",
    location: {
      latitude: 19.267929,
      longitude: 73.231978,
      city: "Kalyan",
      area: "Mharal",
      pincode: "421301"
    },
    coordinates: {
      type: "Point",
      coordinates: [73.231978, 19.267929]
    },
    cuisine: ["South Indian", "Vegetarian"],
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400",
    phone: "+91 9876543213",
    email: "cafe@southindian.com",
    isOpen: true,
    isVeg: true,
    deliveryTime: 25,
    avgPrice: 300,
    offers: []
  },
  {
    name: "China Town",
    address: "Ganpati Chowk, Kalyan West - 421301",
    location: {
      latitude: 19.268929,
      longitude: 73.239978,
      city: "Kalyan",
      area: "Ganpati Chowk",
      pincode: "421301"
    },
    coordinates: {
      type: "Point",
      coordinates: [73.239978, 19.268929]
    },
    cuisine: ["Chinese", "Thai", "Asian"],
    rating: 4.2,
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400",
    phone: "+91 9876543214",
    email: "info@chinatown.com",
    isOpen: true,
    isVeg: false,
    deliveryTime: 35,
    avgPrice: 400,
    offers: [
      {
        text: "20% off on orders above ₹500",
        code: "CHINA20",
        discount: 20,
        validUntil: new Date("2024-12-31")
      }
    ]
  }
];

const seedRestaurants = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resto');
    
    // Clear existing restaurants
    await Restaurant.deleteMany({});
    console.log('Cleared existing restaurants');
    
    // Insert sample restaurants
    const result = await Restaurant.insertMany(sampleRestaurants);
    console.log(`Added ${result.length} restaurants successfully`);
    
    // Log the restaurants with their coordinates
    result.forEach(restaurant => {
      console.log(`- ${restaurant.name}: (${restaurant.location.latitude}, ${restaurant.location.longitude})`);
    });
    
    await mongoose.disconnect();
    console.log('Disconnected from database');
  } catch (error) {
    console.error('Error seeding restaurants:', error);
    process.exit(1);
  }
};

seedRestaurants();
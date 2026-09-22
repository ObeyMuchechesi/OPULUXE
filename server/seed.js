import "dotenv/config";
import mongoose from "mongoose";
import Admin from "./models/Admin.js";
import Service from "./models/Service.js";
import { connectDB } from "./config/db.js";

// 23 services — matches the "Signature Looks" hero and website price list
const services = [
  // ── Braids ──────────────────────────────────────────────
  { name: "Knotless Braids Small Bum Length", price: 750, duration: 300, category: "Braids", order: 1, description: "Small knotless braids to bum length. Hair included." },
  { name: "Knotless Braids Waist Length", price: 850, priceMax: 950, duration: 330, category: "Braids", order: 2, description: "Feather-light knotless braids to waist length." },
  { name: "Knotless Braids Normal Length", price: 550, priceMax: 650, duration: 240, category: "Braids", order: 3, description: "Classic mid-back knotless braids." },
  { name: "Goddess Braids Bum Length", price: 650, priceMax: 750, duration: 270, category: "Braids", order: 4, description: "Boho goddess braids with curly accents." },
  { name: "Box Braids", price: 450, priceMax: 600, duration: 240, category: "Braids", order: 5, description: "Neat box braids in any size, any length." },
  { name: "Fulani Braids", price: 500, priceMax: 650, duration: 240, category: "Braids", order: 6, description: "Tribal Fulani patterns with cuffs and accessories." },
  { name: "Cornrows (Straight Back)", price: 200, priceMax: 300, duration: 120, category: "Braids", order: 7, description: "Clean straight-backs, with or without extensions." },
  { name: "Ghana Weaving", price: 500, priceMax: 700, duration: 240, category: "Braids", order: 8, description: "Bold, sculpted Ghana weaving in your preferred pattern." },
  { name: "Goddess Faux Locs", price: 700, priceMax: 850, duration: 300, category: "Braids", order: 9, description: "Soft faux locs with boho curl detailing." },

  // ── Twists & Curls ──────────────────────────────────────
  { name: "Passion Twist Selfie", price: 500, priceMax: 600, duration: 240, category: "Twists & Curls", order: 10, description: "Soft selfie-length passion twists." },
  { name: "Passion Twist Bum Length", price: 600, priceMax: 700, duration: 270, category: "Twists & Curls", order: 11, description: "Long, bouncy passion twists to bum length." },
  { name: "Spring Twists", price: 550, priceMax: 650, duration: 240, category: "Twists & Curls", order: 12, description: "Full spring twists with a natural finish." },
  { name: "Senegalese Twists", price: 550, priceMax: 650, duration: 240, category: "Twists & Curls", order: 13, description: "Sleek rope twists that hold their shape." },
  { name: "Spanish Curl", price: 850, priceMax: 950, duration: 270, category: "Twists & Curls", order: 14, description: "Lush Spanish curl install, hair included." },
  { name: "Nubian Twist", price: 500, priceMax: 600, duration: 240, category: "Twists & Curls", order: 15, description: "Kinky Nubian twists with a matte finish." },
  { name: "Bantu Knot-out", price: 250, priceMax: 350, duration: 120, category: "Twists & Curls", order: 16, description: "Defined, springy curls from bantu knots." },
  { name: "Unbraiding / Takedown", price: 100, priceMax: 200, duration: 120, category: "Twists & Curls", order: 17, description: "Gentle takedown of previous braids or twists." },

  // ── Straight & Sleek ────────────────────────────────────
  { name: "Bone Straight", price: 1000, duration: 240, category: "Straight & Sleek", order: 18, description: "Silky bone-straight install with premium hair." },
  { name: "Silk Press", price: 300, priceMax: 400, duration: 120, category: "Straight & Sleek", order: 19, description: "Smooth, glossy silk press with heat protectant." },
  { name: "Blowout", price: 150, priceMax: 250, duration: 90, category: "Straight & Sleek", order: 20, description: "Volume-boosting blowout with a soft finish." },

  // ── Treatments ──────────────────────────────────────────
  { name: "Steam Treatment", price: 150, priceMax: 250, duration: 45, category: "Treatments", order: 21, description: "Deep-hydration steam therapy for dry hair." },
  { name: "Protein Treatment", price: 200, priceMax: 300, duration: 45, category: "Treatments", order: 22, description: "Strength-restoring protein rebuild for weak strands." },
  { name: "Trim & Scalp Care", price: 100, priceMax: 200, duration: 45, category: "Treatments", order: 23, description: "Split-end dusting with a refreshing scalp detox." },
];

async function seed() {
  await connectDB();

  // Admin account
  const email = (process.env.ADMIN_EMAIL || "admin@opuluxe.com").toLowerCase();
  const existingAdmin = await Admin.findOne({ email });
  if (!existingAdmin) {
    await Admin.create({
      name: process.env.ADMIN_NAME || "Studio Owner",
      email,
      password: process.env.ADMIN_PASSWORD || "opuluxe123",
      role: "owner",
    });
    console.log(`👑 Admin created: ${email}`);
  } else {
    console.log("👑 Admin already exists, skipping");
  }

  // Services
  const count = await Service.countDocuments({});
  if (count === 0) {
    await Service.insertMany(services);
    console.log(`💅 ${services.length} services seeded`);
  } else {
    console.log(`💅 ${count} services already exist, skipping`);
  }

  await mongoose.disconnect();
  console.log("✨ Seed complete");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

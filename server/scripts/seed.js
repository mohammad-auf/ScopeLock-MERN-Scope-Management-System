require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Project = require('../models/Project');
const ScopeItem = require('../models/ScopeItem');

const seedData = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Missing MONGODB_URI in environment.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany();
    await Project.deleteMany();
    await ScopeItem.deleteMany();
    console.log('Cleared existing data');

    // 1. Create a Freelancer User
    const passwordHash = await bcrypt.hash('password123', 10);
    const freelancer = await User.create({
      name: 'Demo Freelancer',
      email: 'freelancer@scopelock.com',
      passwordHash,
    });
    console.log(`Created Freelancer: ${freelancer.email} (Password: password123)`);

    // 2. Create a Project
    const project = await Project.create({
      freelancerId: freelancer._id,
      title: 'E-Commerce Website Redesign',
      clientName: 'Acme Corp',
      hourlyRate: 150,
      status: 'active',
    });
    console.log(`Created Project: ${project.title}`);

    // 3. Create Scope Items
    const scopeItems = await ScopeItem.insertMany([
      {
        projectId: project._id,
        title: 'User Authentication',
        description: 'Login and registration with email/password and OAuth',
        categoryTag: 'auth',
        estimatedHours: 20,
      },
      {
        projectId: project._id,
        title: 'Product Catalog',
        description: 'Product listing page with search and filtering',
        categoryTag: 'catalog',
        estimatedHours: 45,
      },
      {
        projectId: project._id,
        title: 'Shopping Cart',
        description: 'Add to cart, update quantities, remove items',
        categoryTag: 'cart',
        estimatedHours: 15,
      },
      {
        projectId: project._id,
        title: 'Stripe Payment Integration',
        description: 'Secure checkout and order confirmation',
        categoryTag: 'payment',
        estimatedHours: 25,
      },
    ]);
    console.log(`Created ${scopeItems.length} Scope Items`);

    console.log('\n--- Seed Complete ---');
    console.log(`Client Portal URL: http://localhost:3000/portal/${project.portalToken}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

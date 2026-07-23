require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Fixed: was bcryptjs, only bcrypt is installed

const User = require('../models/User');
const Project = require('../models/Project');
const ScopeItem = require('../models/ScopeItem');

/**
 * Demo seed data constants — used to identify and safely clean up seed data.
 * We NEVER wipe entire collections; we only delete known demo records.
 */
const DEMO_EMAIL = 'freelancer@scopelock.com';

const seedData = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Missing MONGODB_URI in environment.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // ─── Safe cleanup: only delete known demo records ──────────────────────
    // Find the existing demo user (if any) to also clean up their projects/items
    const existingDemo = await User.findOne({ email: DEMO_EMAIL });
    if (existingDemo) {
      const existingProjects = await Project.find({ freelancerId: existingDemo._id });
      const existingProjectIds = existingProjects.map((p) => p._id);

      // Delete scope items belonging to demo projects
      if (existingProjectIds.length > 0) {
        await ScopeItem.deleteMany({ projectId: { $in: existingProjectIds } });
        console.log(`Removed ${existingProjectIds.length} demo project(s) and their scope items`);
      }

      // Delete demo projects
      await Project.deleteMany({ freelancerId: existingDemo._id });

      // Delete demo user
      await User.deleteOne({ email: DEMO_EMAIL });
      console.log(`Removed existing demo user: ${DEMO_EMAIL}`);
    } else {
      console.log('No existing demo data found — running fresh seed');
    }

    // ─── 1. Create a Demo Freelancer User ─────────────────────────────────
    const passwordHash = await bcrypt.hash('password123', 10);
    const freelancer = await User.create({
      name: 'Demo Freelancer',
      email: DEMO_EMAIL,
      passwordHash,
    });
    console.log(`Created Freelancer: ${freelancer.email} (Password: password123)`);

    // ─── 2. Create a Demo Project ──────────────────────────────────────────
    const project = await Project.create({
      freelancerId: freelancer._id,
      title: 'E-Commerce Website Redesign',
      clientName: 'Acme Corp',
      hourlyRate: 150,
      status: 'active',
    });
    console.log(`Created Project: ${project.title}`);

    // ─── 3. Create Demo Scope Items ────────────────────────────────────────
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
    console.log(`Login:            ${DEMO_EMAIL} / password123`);
    console.log(`Client Portal URL: http://localhost:3000/portal/${project.portalToken}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

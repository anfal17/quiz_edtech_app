const path = require('path');
const fs = require('fs');

// Try to load .env from server directory first, then root
const serverEnv = path.join(__dirname, '..', '.env');
const rootEnv = path.join(__dirname, '..', '..', '.env');

if (fs.existsSync(serverEnv)) {
    require('dotenv').config({ path: serverEnv });
} else if (fs.existsSync(rootEnv)) {
    require('dotenv').config({ path: rootEnv });
} else {
    console.warn('⚠️ No .env file found. Environment variables might be missing.');
}
const mongoose = require('mongoose');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@ilmpath.com';
        const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'admin123';

        // Check if superadmin already exists
        const existingSuperAdmin = await User.findOne({
            $or: [
                { email: superAdminEmail },
                { role: ROLES.SUPERADMIN }
            ]
        });

        if (existingSuperAdmin) {
            console.log('⚠️ Superadmin already exists');
            if (existingSuperAdmin.role !== ROLES.SUPERADMIN) {
                console.log('🔄 Updating existing user to Superadmin role...');
                existingSuperAdmin.role = ROLES.SUPERADMIN;
                await existingSuperAdmin.save();
                console.log('✅ User role updated to Superadmin');
            }
        } else {
            console.log('🆕 Creating new Superadmin user...');
            await User.create({
                name: 'Super Admin',
                email: superAdminEmail,
                password: superAdminPassword,
                role: ROLES.SUPERADMIN,
                avatar: '👑',
                isActive: true
            });
            console.log('✅ Superadmin created successfully');
            console.log(`📧 Email: ${superAdminEmail}`);
            console.log(`🔑 Password: ${superAdminPassword}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding superadmin:', error);
        process.exit(1);
    }
};

seedSuperAdmin();

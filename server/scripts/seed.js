const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

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

const User = require('../models/User');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Quiz = require('../models/Quiz');
// const Progress = require('../models/Progress'); // Optional: clear progress
const { ROLES } = require('../config/constants');

const seedData = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await User.deleteMany({});
        await Course.deleteMany({});
        await Chapter.deleteMany({});
        await Quiz.deleteMany({});
        // await Progress.deleteMany({});
        console.log('✅ Data cleared');

        // Create superadmin user
        console.log('👤 Creating superadmin...');
        const admin = await User.create({
            name: 'Super Admin',
            email: 'admin@ilmpath.com',
            password: 'admin123',
            role: ROLES.SUPERADMIN,
            avatar: '👑',
            isActive: true,
            xp: 1000
        });
        console.log('✅ Created superadmin: admin@ilmpath.com / admin123');

        // Create sample courses
        console.log('📚 Creating courses...');
        const courses = await Course.insertMany([
            {
                title: 'Quran Essentials',
                description: 'Learn the fundamentals of Quran recitation, tajweed, and understanding.',
                icon: '📖',
                difficulty: 'beginner',
                tags: ['quran', 'recitation', 'tajweed'],
                color: 'from-emerald-500 to-teal-500',
                order: 1,
                isPublished: true,
                createdBy: admin._id
            },
            {
                title: 'Hadith Studies',
                description: 'Explore the sayings and actions of Prophet Muhammad (PBUH).',
                icon: '📜',
                difficulty: 'intermediate',
                tags: ['hadith', 'sunnah', 'prophetic'],
                color: 'from-amber-500 to-orange-500',
                order: 2,
                isPublished: true,
                createdBy: admin._id
            },
            {
                title: 'Islamic Jurisprudence (Fiqh)',
                description: 'Understanding Islamic law and jurisprudence for daily practice.',
                icon: '⚖️',
                difficulty: 'intermediate',
                tags: ['fiqh', 'law', 'worship'],
                color: 'from-blue-500 to-indigo-500',
                order: 3,
                isPublished: true,
                createdBy: admin._id
            },
            {
                title: 'Islamic Creed (Aqeedah)',
                description: 'Core beliefs and theology in Islam.',
                icon: '🌙',
                difficulty: 'beginner',
                tags: ['aqeedah', 'belief', 'theology'],
                color: 'from-purple-500 to-violet-500',
                order: 4,
                isPublished: true,
                createdBy: admin._id
            }
        ]);
        console.log(`✅ Created ${courses.length} courses`);

        // Create chapters for Quran course (courses[0])
        console.log('📄 Creating chapters...');
        const quranChapters = await Chapter.insertMany([
            {
                courseId: courses[0]._id,
                title: 'Introduction to the Quran',
                content: '<h1>Introduction to the Quran</h1><p>The Quran is the holy book of Islam, believed to be the word of Allah revealed to Prophet Muhammad (PBUH).</p><h2>Key Points</h2><ul><li>Revealed over 23 years</li><li>Contains 114 surahs</li><li>Written in Arabic</li></ul>',
                type: 'reading',
                estimatedMinutes: 15,
                order: 1,
                xpReward: 50,
                isPublished: true
            },
            {
                courseId: courses[0]._id,
                title: 'Arabic Letters Basics',
                content: '<h1>Arabic Letters</h1><p>Learning the Arabic alphabet is the first step to reading the Quran.</p>',
                type: 'reading',
                estimatedMinutes: 20,
                order: 2,
                xpReward: 75,
                isPublished: true
            },
            {
                courseId: courses[0]._id,
                title: 'Introduction to Tajweed',
                content: '<h1>What is Tajweed?</h1><p>Tajweed means to recite the Quran correctly with proper pronunciation.</p>',
                type: 'both',
                estimatedMinutes: 25,
                order: 3,
                xpReward: 100,
                isPublished: true
            }
        ]);
        console.log(`✅ Created ${quranChapters.length} chapters for Quran course`);

        // Create a quiz for the third chapter
        console.log('❓ Creating quiz...');
        const quiz = await Quiz.create({
            courseId: courses[0]._id,
            chapterId: quranChapters[2]._id, // 'Introduction to Tajweed' (index 2)
            title: 'Tajweed Basics Quiz',
            description: 'Test your knowledge of basic Tajweed concepts',
            questions: [
                {
                    type: 'mcq',
                    question: 'What does the word "Tajweed" mean linguistically?',
                    options: ['To separate', 'To improve/beautify', 'To read fast', 'To memorize'],
                    correctAnswer: 1, // 'To improve/beautify'
                    explanation: 'Linguistically, Tajweed means proficiency or doing something well. In Quranic terms, it means giving every letter its rights.'
                },
                {
                    type: 'true-false',
                    question: 'Tajweed is mandatory for every Muslim to learn.',
                    options: ['True', 'False'],
                    correctAnswer: 0, // True (generally considered fard ayn or kifayah depending on level, but basic correct reading is fard)
                    explanation: 'Reading the Quran correctly without changing meanings is an obligation.'
                }
            ],
            passingScore: 70,
            xpReward: 100,
            isPublished: true,
            createdBy: admin._id
        });
        console.log('✅ Created sample quiz');

        console.log('\n🎉 Database seeded successfully!');
        console.log('\nAdmin credentials:');
        console.log('  Email: admin@ilmpath.com');
        console.log('  Password: admin123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seedData();

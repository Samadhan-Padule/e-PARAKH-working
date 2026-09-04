require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('./models/User');
const { mongoUri } = require('./config/env');

async function createSeniorOfficer() {
    try {
        await mongoose.connect(mongoUri);

        const officialEmail = 'senior@eparakh.gov.in';
        const employeeId = 'SENIOR001';

        const existingUser = await User.findOne({
            $or: [
                { officialEmail },
                { employeeId }
            ]
        });

        if (existingUser) {
            console.log('Senior Officer already exists.');
            console.log({
                email: existingUser.officialEmail,
                employeeId: existingUser.employeeId,
                role: existingUser.role,
                status: existingUser.status
            });

            await mongoose.disconnect();
            return;
        }

        const password = 'Senior@123';
        const passwordHash = await bcrypt.hash(password, 12);

        const senior = await User.create({
            fullName: 'Senior Officer',
            employeeId,
            department: 'Legal Metrology',
            designation: 'Senior Legal Metrology Officer',
            state: 'Maharashtra',
            district: 'Pune',
            officeName: 'Legal Metrology Office',
            officialEmail,
            officialMobile: '9000000001',
            passwordHash,
            role: 'SENIOR_OFFICER',
            status: 'ACTIVE',
            seniorOfficerId: null,
            approvedAt: new Date()
        });

        console.log('');
        console.log('========================================');
        console.log('Senior Officer created successfully');
        console.log('========================================');
        console.log('Email      :', senior.officialEmail);
        console.log('Employee ID:', senior.employeeId);
        console.log('Password   :', password);
        console.log('Role       :', senior.role);
        console.log('Status     :', senior.status);
        console.log('========================================');
        console.log('');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Failed to create Senior Officer:', error.message);
        process.exitCode = 1;
    }
}

createSeniorOfficer();
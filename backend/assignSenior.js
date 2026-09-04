const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

async function assignSenior() {
    try {

        const mongoUri =
            process.env.MONGODB_URI ||
            process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error(
                "MongoDB connection string not found in .env"
            );
        }

        await mongoose.connect(mongoUri);

        console.log("MongoDB connected.");


        // =====================================================
        // FIND TEST SENIOR OFFICER
        // =====================================================

        const senior = await User.findOne({
            employeeId: "SENIOR001",
            role: "SENIOR_OFFICER"
        });


        if (!senior) {

            throw new Error(
                "Senior Officer SENIOR001 not found."
            );

        }


        // =====================================================
        // FIND TEST INSPECTOR
        // =====================================================

       const inspector = await User.findOne({
    employeeId: "TEST001",
    role: "INSPECTOR"
});


        if (!inspector) {

            throw new Error(
                "Inspector LM-2026-001 not found."
            );

        }


        // =====================================================
        // ASSIGN SENIOR
        // =====================================================

        inspector.seniorOfficerId =
            senior._id;

        await inspector.save();


        console.log(
            "=========================================="
        );

        console.log(
            "INSPECTOR → SENIOR ASSIGNMENT SUCCESS"
        );

        console.log(
            "=========================================="
        );

        console.log(
            "Inspector:",
            inspector.fullName
        );

        console.log(
            "Inspector ID:",
            inspector.employeeId
        );

        console.log(
            "Role:",
            inspector.role
        );

        console.log(
            "Assigned Senior:",
            senior.fullName
        );

        console.log(
            "Senior ID:",
            senior.employeeId
        );

        console.log(
            "seniorOfficerId:",
            inspector.seniorOfficerId.toString()
        );

        console.log(
            "=========================================="
        );

    } catch (error) {

        console.error(
            "Senior assignment failed:",
            error
        );

    } finally {

        await mongoose.disconnect();

        console.log(
            "MongoDB disconnected."
        );

    }
}

assignSenior();
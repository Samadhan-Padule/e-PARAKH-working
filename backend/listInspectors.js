const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

async function listInspectors() {
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

        console.log("MongoDB connected.\n");

        const inspectors = await User.find({
            role: "INSPECTOR"
        })
        .select(
            "fullName employeeId officialEmail status seniorOfficerId department designation"
        )
        .lean();

        console.log(
            "========== INSPECTORS =========="
        );

        if (!inspectors.length) {

            console.log(
                "No Inspector accounts found."
            );

        } else {

            inspectors.forEach(
                (inspector, index) => {

                    console.log(
                        `\nInspector ${index + 1}`
                    );

                    console.log(
                        "Name:",
                        inspector.fullName
                    );

                    console.log(
                        "Employee ID:",
                        inspector.employeeId
                    );

                    console.log(
                        "Email:",
                        inspector.officialEmail
                    );

                    console.log(
                        "Status:",
                        inspector.status
                    );

                    console.log(
                        "Senior Officer ID:",
                        inspector.seniorOfficerId || "NOT ASSIGNED"
                    );

                }
            );
        }

        console.log(
            "\n================================"
        );

    } catch (error) {

        console.error(
            "Unable to list inspectors:",
            error
        );

    } finally {

        await mongoose.disconnect();

        console.log(
            "MongoDB disconnected."
        );

    }
}

listInspectors();
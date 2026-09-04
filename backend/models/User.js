const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        employeeId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        department: {
            type: String,
            required: true,
            trim: true
        },

        designation: {
            type: String,
            required: true,
            trim: true
        },

        state: {
            type: String,
            required: true,
            trim: true
        },

        district: {
            type: String,
            required: true,
            trim: true
        },

        officeName: {
            type: String,
            required: true,
            trim: true
        },

        officialEmail: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        officialMobile: {
            type: String,
            required: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        // User role
        role: {
            type: String,
            enum: ['INSPECTOR', 'SENIOR_OFFICER', 'ADMIN'],
            default: 'INSPECTOR',
            required: true
        },

        // Senior Officer responsible for this Inspector
        seniorOfficerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },

        // Account status
        status: {
            type: String,
            enum: ['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'],
            default: 'PENDING',
            required: true
        },

        // Approval information
        approvedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


// Return safe user information.
// Password hash is never included.
userSchema.methods.toSafeObject = function toSafeObject() {
    return {
        id: this._id.toString(),

        fullName: this.fullName,

        officialEmail: this.officialEmail,

        employeeId: this.employeeId,

        role: this.role,

        status: this.status,

        seniorOfficerId: this.seniorOfficerId
            ? this.seniorOfficerId.toString()
            : null,

        department: this.department,

        designation: this.designation,

        state: this.state,

        district: this.district,

        officeName: this.officeName,

        officialMobile: this.officialMobile,

        approvedAt: this.approvedAt,

        createdAt: this.createdAt,

        updatedAt: this.updatedAt
    };
};


module.exports = mongoose.model('User', userSchema);
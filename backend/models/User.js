const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	fullName: { type: String, required: true, trim: true },
	employeeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
	department: { type: String, required: true, trim: true },
	designation: { type: String, required: true, trim: true },
	state: { type: String, required: true, trim: true },
	district: { type: String, required: true, trim: true },
	officeName: { type: String, required: true, trim: true },
	officialEmail: { type: String, required: true, unique: true, trim: true, lowercase: true },
	officialMobile: { type: String, required: true, trim: true },
	passwordHash: { type: String, required: true, select: false },
	role: { type: String, enum: ['INSPECTOR', 'ADMIN'], default: 'INSPECTOR', required: true },
	status: { type: String, enum: ['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'], default: 'PENDING', required: true },
	approvedAt: { type: Date, default: null }
}, { timestamps: true });

userSchema.methods.toSafeObject = function toSafeObject() {
	return {
		id: this._id.toString(), fullName: this.fullName, officialEmail: this.officialEmail,
		employeeId: this.employeeId, role: this.role, status: this.status,
		department: this.department, designation: this.designation, state: this.state,
		district: this.district, officeName: this.officeName, officialMobile: this.officialMobile,
		approvedAt: this.approvedAt, createdAt: this.createdAt, updatedAt: this.updatedAt
	};
};

module.exports = mongoose.model('User', userSchema);

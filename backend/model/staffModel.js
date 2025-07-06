const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  availability: { type: String, enum: ['available', 'unavailable'], default: 'available' },
  tasks: [{
    taskTitle: { type: String, required: true },
    taskDescription: { type: String },
    priorityLevel: { type: String, enum: ['low', 'medium', 'high'] },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    completedDate: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attachments: [{ type: String }], 
  }],
  leaveRequests: [{
    leaveType: { type: String, enum: ['sick', 'casual', 'annual'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    option: { type: String, enum: ['half-day', 'full-day'], required: true },
    noOfDays: { type: Number, required: true },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
  }],
  attendance: [{
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
  }],
  leaveBalance: {
    annual: { type: Number, default: 14 }, // Example default values
    casual: { type: Number, default: 7 },
    sick: { type: Number, default: 7 },
  },
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
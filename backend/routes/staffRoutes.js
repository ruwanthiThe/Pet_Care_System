const express = require('express');
const router = express.Router();
const { protect, staff } = require('../middleware/auth');
const {
  getTaskList,
  markTaskCompleted,
  submitLeaveRequest,
  getLeaveStatus,
  markAttendance,
  deleteLeaveRequest,

  completeTask,
  getAttendance,

  getStaffProfile, // New import
  updateStaffProfile, // New import

} = require('../controllers/staffController');

// Profile routes
router.get('/profile', protect, staff, getStaffProfile);
router.put('/profile', protect, staff, updateStaffProfile);

// Existing routes
router.get('/tasks', protect, staff, getTaskList);
router.put('/tasks/:taskId/complete', protect, staff, completeTask);
router.post('/leave-request', protect, staff, submitLeaveRequest);
router.get('/leave-status', protect, staff, getLeaveStatus);
router.post('/attendance', protect, staff, markAttendance);
router.get('/attendance', protect, staff, getAttendance);
router.delete('/leave-request/:requestId', protect, staff, deleteLeaveRequest);

module.exports = router;
const Staff = require('../models/Staff');
const User = require('../models/User'); // Import User model for profile data

// Fetch the staff member's profile
exports.getStaffProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const staff = await Staff.findOne({ userId: req.user._id });
    
    if (!user || !staff) {
      return res.status(404).json({ message: 'Staff profile not found' });
    }
    
    // Make sure all necessary fields are included in the response
    res.json({ 
      user: user, 
      staff: staff
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update the staff member's profile
exports.updateStaffProfile = async (req, res) => {
  try {
    console.log("Received update profile request:", req.body);
    const { phone, address, availability } = req.body;
    const user = await User.findById(req.user._id);
    const staff = await Staff.findOne({ userId: req.user._id });
    
    if (!user || !staff) {
      console.error("Staff profile not found for user:", req.user._id);
      return res.status(404).json({ message: 'Staff profile not found' });
    }
    
    // Update user fields
    if (phone) user.phone = phone;
    if (address) user.address = address;
    
    // Update staff fields
    if (availability) {
      if (!staff.availability) {
        staff.set("availability", availability);
      } else {
        staff.availability = availability;
      }
    }
    
    console.log("Saving updated profile:", {
      user: { phone: user.phone, address: user.address },
      staff: { availability: staff.availability }
    });
    
    await user.save();
    await staff.save();
    
    res.json({ 
      message: 'Profile updated successfully',
      updatedUser: {
        phone: user.phone,
        address: user.address
      },
      updatedStaff: {
        availability: staff.availability
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: error.message });
  }
};

// Existing functions (unchanged)
exports.getTaskList = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user._id }).select('tasks');
    if (!staff) return res.status(404).json({ message: 'Staff data not found' });
    
    const formattedTasks = staff.tasks.map(task => {
      const taskObj = task.toObject();
      
      if (taskObj.startDate) {
        taskObj.startDate = taskObj.startDate.toISOString();
      }
      
      if (taskObj.dueDate) {
        taskObj.dueDate = taskObj.dueDate.toISOString();
      }
      
      if (taskObj.completedDate) {
        taskObj.completedDate = taskObj.completedDate.toISOString();
      }
      
      return taskObj;
    });
    
    console.log('Sending formatted tasks to frontend:', formattedTasks);
    res.json(formattedTasks);
  } catch (error) {
    console.error('Error fetching task list:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.markTaskCompleted = async (req, res) => {
  try {
    const { taskId } = req.params;
    const staff = await Staff.findOne({ userId: req.user._id });
    if (!staff) return res.status(404).json({ message: 'Staff data not found' });

    const task = staff.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.status = 'completed';
    await staff.save();
    res.json({ message: 'Task marked as completed', task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitLeaveRequest = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, option, noOfDays, reason } = req.body;
    const staff = await Staff.findOne({ userId: req.user._id });
    if (!staff) return res.status(404).json({ message: 'Staff data not found' });

    staff.leaveRequests.push({ leaveType, startDate, endDate, option, noOfDays, reason });
    await staff.save();
    res.status(201).json({ message: 'Leave request submitted', leaveRequest: staff.leaveRequests[staff.leaveRequests.length - 1] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLeaveStatus = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user._id }).select('leaveRequests');
    if (!staff) return res.status(404).json({ message: 'Staff data not found' });
    res.json(staff.leaveRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.body;
    const staff = await Staff.findOne({ userId: req.user._id });
    if (!staff) return res.status(404).json({ message: 'Staff data not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const alreadyMarkedToday = staff.attendance.some(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
    
    if (alreadyMarkedToday) {
      return res.status(400).json({ 
        message: 'Attendance has already been marked for today'
      });
    }
        let checkInTime = null;
    if (checkIn) {
      const [hours, minutes] = checkIn.split(':').map(Number);
      checkInTime = new Date(today);
      checkInTime.setHours(hours, minutes, 0);
    }
    
    let checkOutTime = null;
    if (checkOut) {
      const [hours, minutes] = checkOut.split(':').map(Number);
      checkOutTime = new Date(today);
      checkOutTime.setHours(hours, minutes, 0);
    }

    const attendanceRecord = {
      date: today,
      checkIn: checkInTime,
      checkOut: checkOutTime
    };
    
    staff.attendance.push(attendanceRecord);
    await staff.save();
    
    const savedRecord = staff.attendance[staff.attendance.length - 1].toObject();
    
    const formattedRecord = {
      _id: savedRecord._id,
      date: savedRecord.date.toISOString(),
      checkIn: checkIn,
      checkOut: checkOut
    };
    
    res.status(200).json({ 
      message: 'Attendance marked successfully', 
      attendance: formattedRecord 
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    const staff = await Staff.findOne({ userId });
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    
    const taskIndex = staff.tasks.findIndex(task => task._id.toString() === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    staff.tasks[taskIndex].status = 'completed';
    staff.tasks[taskIndex].completedDate = new Date();
    staff.tasks[taskIndex].completedBy = userId;
    
    await staff.save();
    
    const updatedTask = staff.tasks[taskIndex].toObject();
    
    if (updatedTask.startDate) {
      updatedTask.startDate = updatedTask.startDate.toISOString();
    }
    
    if (updatedTask.dueDate) {
      updatedTask.dueDate = updatedTask.dueDate.toISOString();
    }
    
    if (updatedTask.completedDate) {
      updatedTask.completedDate = updatedTask.completedDate.toISOString();
    }
    
    console.log('Task completed successfully:', updatedTask);
    
    res.status(200).json({ 
      message: 'Task marked as completed',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const staff = await Staff.findOne({ userId: req.user._id }).select('attendance');
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff data not found' });
    }
    
    const formattedAttendance = staff.attendance.map(record => {
      const recordObj = record.toObject();
      
      if (recordObj.date) {
        recordObj.date = recordObj.date.toISOString();
      }
      
      if (recordObj.checkIn) {
        const date = new Date(recordObj.checkIn);
        recordObj.checkIn = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      if (recordObj.checkOut) {
        const date = new Date(recordObj.checkOut);
        recordObj.checkOut = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      return recordObj;
    });
    
    res.json(formattedAttendance);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add this function to your exports

exports.deleteLeaveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Find the staff member
    const staff = await Staff.findOne({ userId: req.user._id });
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff data not found' });
    }
    
    // Find the leave request
    const leaveRequestIndex = staff.leaveRequests.findIndex(
      request => request._id.toString() === requestId
    );
    
    if (leaveRequestIndex === -1) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    // Check if the request is in "pending" status only
    const leaveRequest = staff.leaveRequests[leaveRequestIndex];
    if (leaveRequest.status && leaveRequest.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending leave requests can be deleted'
      });
    }
    
    // Remove the leave request
    staff.leaveRequests.splice(leaveRequestIndex, 1);
    
    // Save the updated staff document
    await staff.save();
    
    res.status(200).json({
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting leave request:', error);
    res.status(500).json({ message: error.message });
  }
};
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Alert, 
  Snackbar, 
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isToday } from 'date-fns';

const Attendance = () => {
  const { token } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [formData, setFormData] = useState({ 
    checkIn: null, 
    checkOut: null 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alreadyMarkedToday, setAlreadyMarkedToday] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff/attendance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setAttendanceData(data);
      
      const attendanceMarkedToday = data.some(record => {
        try {
          const recordDate = new Date(record.date);
          return isToday(recordDate);
        } catch (error) {
          console.error('Error checking date:', error);
          return false;
        }
      });
      
      setAlreadyMarkedToday(attendanceMarkedToday);
      setError('');
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to load attendance records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [token]);

  const handleTimeChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.checkIn || !formData.checkOut) {
      setSnackbar({
        open: true,
        message: 'Please select both check-in and check-out times',
        severity: 'error'
      });
      return;
    }

    const checkInTime = format(formData.checkIn, 'HH:mm');
    const checkOutTime = format(formData.checkOut, 'HH:mm');

    try {
      const response = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          checkIn: checkInTime, 
          checkOut: checkOutTime 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 && errorData.message === 'Attendance has already been marked for today') {
          setAlreadyMarkedToday(true);
          setSnackbar({
            open: true,
            message: 'You have already marked your attendance for today',
            severity: 'warning'
          });
        } else {
          throw new Error(errorData.message || `Server responded with status: ${response.status}`);
        }
        return;
      }
      
      const data = await response.json();
      
      setSnackbar({
        open: true,
        message: 'Attendance marked successfully',
        severity: 'success'
      });
      
      setFormData({ checkIn: null, checkOut: null });
      setAlreadyMarkedToday(true);
      fetchAttendance(); 
    } catch (error) {
      console.error('Error marking attendance:', error);
      setSnackbar({
        open: true,
        message: 'Failed to mark attendance. Please try again.',
        severity: 'error'
      });
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ padding: 2 }}>
        <Typography variant="h5" gutterBottom>
          Attendance
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Mark Today's Attendance
          </Typography>
          
          {alreadyMarkedToday ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              You have already marked your attendance for today.
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', maxWidth: 400 }}>
              <TimePicker
                label="Check-In Time"
                value={formData.checkIn}
                onChange={(newValue) => handleTimeChange('checkIn', newValue)}
                sx={{ my: 2 }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    helperText: "Select your check-in time"
                  },
                }}
              />
              <TimePicker
                label="Check-Out Time"
                value={formData.checkOut}
                onChange={(newValue) => handleTimeChange('checkOut', newValue)}
                sx={{ my: 2 }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    helperText: "Select your check-out time"
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                type="submit"
                sx={{ mt: 2, alignSelf: 'flex-start' }}
              >
                Mark Attendance
              </Button>
            </Box>
          )}
        </Paper>
        
        <Typography variant="h6" gutterBottom>
          Attendance History
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : attendanceData.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Check-In</TableCell>
                  <TableCell>Check-Out</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceData.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>{record.checkIn || 'N/A'}</TableCell>
                    <TableCell>{record.checkOut || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="textSecondary">
            No attendance records found.
          </Typography>
        )}
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default Attendance;
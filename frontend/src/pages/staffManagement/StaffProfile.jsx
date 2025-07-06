import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import api from '../../services/api';
import EditIcon from '@mui/icons-material/Edit';

const StaffProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    employeeId: '',
    department: '',
    availability: 'available',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/staff/profile');
        const { user, staff } = response.data;
        console.log("Profile data:", { user, staff });
        
        setProfile({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: user.address || '',
          employeeId: user.staffDetails?.staffId || '',
          department: user.staffDetails?.department || '',
          availability: staff.availability || 'available',
        });
      } catch (error) {
        console.error("Profile fetch error:", error);
        setError(error.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("Field changed:", name, value);
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleEditMode = () => {
    const newEditMode = !editMode;
    console.log("Toggling edit mode from", editMode, "to", newEditMode);
    setEditMode(newEditMode);
  };
  
  const forcedEditMode = () => {
    setEditMode(true);
    console.log("FORCED edit mode to TRUE");
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    console.log("Submitting profile update:", profile);
    
    try {
      const updatedData = {
        phone: profile.phone,
        address: profile.address,
        availability: profile.availability || 'available',
      };
      
      console.log("Sending update data:", updatedData);
      
      try {
        const response = await api.put('/staff/profile', updatedData);
        console.log("Update response:", response.data);
        
        setSuccess('Profile updated successfully');
        setEditMode(false);
      } catch (axiosError) {
        console.error("Axios error details:", {
          response: axiosError.response?.data,
          status: axiosError.response?.status,
          headers: axiosError.response?.headers,
          request: axiosError.request,
          message: axiosError.message
        });
        
        setError(axiosError.response?.data?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error("General update error:", error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        My Profile {editMode ? '(Editing)' : '(View Only)'}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={profile.name}
              disabled
              variant="outlined"
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={profile.email}
              disabled
              variant="outlined"
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              disabled={!editMode}
              variant="outlined"
              margin="normal"
              InputProps={{
                readOnly: !editMode,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={profile.address}
              onChange={handleChange}
              disabled={!editMode}
              variant="outlined"
              margin="normal"
              InputProps={{
                readOnly: !editMode,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Employee ID"
              name="employeeId"
              value={profile.employeeId}
              disabled
              variant="outlined"
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Department"
              name="department"
              value={profile.department}
              disabled
              variant="outlined"
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Availability</InputLabel>
              <Select
                name="availability"
                value={profile.availability || 'available'}
                onChange={handleChange}
                disabled={!editMode}
                label="Availability"
                readOnly={!editMode}
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="unavailable">Unavailable</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box mt={3} display="flex" alignItems="center">
          {editMode ? (
            <>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mr: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleEditMode}
                disabled={loading}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={forcedEditMode}
                startIcon={<EditIcon />}
                sx={{ 
                  bgcolor: '#ff9800', 
                  '&:hover': { 
                    bgcolor: '#f57c00'
                  }
                }}
              >
                Force Edit Mode
              </Button>
            </Box>
          )}
        </Box>
      </form>
    </Box>
  );
};

export default StaffProfile;
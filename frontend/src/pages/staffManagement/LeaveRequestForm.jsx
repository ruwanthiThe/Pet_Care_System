import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  TextField, 
  Button, 
  Box, 
  MenuItem, 
  Typography, 
  Snackbar, 
  Alert, 
  Paper, 
  Grid, 
  Divider,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Card,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  InputAdornment,
  styled,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  DatePicker 
} from '@mui/x-date-pickers/DatePicker';
import { 
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
  EventAvailable as EventAvailableIcon,
  BugReport as SickIcon, 
  BeachAccess as CasualIcon,
  Event as AnnualIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  HourglassFull as HourglassIcon
} from '@mui/icons-material';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
  }
}));

const LeaveTypeButton = styled(Button)(({ theme, selected, leaveType }) => {
  let backgroundColor = theme.palette.grey[100];
  let color = theme.palette.text.primary;
  let iconColor = theme.palette.primary.main;
  
  if (selected) {
    switch (leaveType) {
      case 'sick':
        backgroundColor = 'rgba(244, 67, 54, 0.1)';
        iconColor = '#f44336';
        break;
      case 'casual':
        backgroundColor = 'rgba(33, 150, 243, 0.1)';
        iconColor = '#2196f3';
        break;
      case 'annual':
        backgroundColor = 'rgba(76, 175, 80, 0.1)';
        iconColor = '#4caf50';
        break;
      default:
        backgroundColor = theme.palette.primary.light;
    }
  }
  
  return {
    padding: theme.spacing(2),
    backgroundColor,
    color,
    border: selected ? `1px solid ${iconColor}` : '1px solid transparent',
    '&:hover': {
      backgroundColor: selected 
        ? backgroundColor 
        : theme.palette.grey[200],
    },
    '& .MuiButton-startIcon': {
      color: iconColor
    }
  };
});

const StepContent = ({ step, children }) => {
  return (
    <Box sx={{ mt: 4, mb: 2 }}>
      {children}
    </Box>
  );
};

const LeaveTypeIcon = ({ type, fontSize = 'medium' }) => {
  switch (type) {
    case 'sick':
      return <SickIcon fontSize={fontSize} color="error" />;
    case 'casual':
      return <CasualIcon fontSize={fontSize} color="primary" />;
    case 'annual':
      return <AnnualIcon fontSize={fontSize} color="success" />;
    default:
      return <EventAvailableIcon fontSize={fontSize} color="action" />;
  }
};

const LeaveRequestForm = () => {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: null,
    endDate: null,
    option: '',
    noOfDays: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [leaveBalance, setLeaveBalance] = useState({
    sick: 10,
    casual: 7,
    annual: 21
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Simulate fetching leave balance from the backend
  useEffect(() => {
    // In a real app, you would fetch the leave balance from your API
    // const fetchLeaveBalance = async () => {
    //   try {
    //     const response = await fetch('/api/staff/leave-balance', {
    //       headers: { Authorization: `Bearer ${token}` }
    //     });
    //     const data = await response.json();
    //     if (response.ok) {
    //       setLeaveBalance(data);
    //     }
    //   } catch (error) {
    //     console.error('Error fetching leave balance:', error);
    //   }
    // };
    // fetchLeaveBalance();
  }, [token]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLeaveTypeSelect = (leaveType) => {
    setFormData(prev => ({ ...prev, leaveType }));
  };

  const handleOptionSelect = (option) => {
    setFormData(prev => ({ ...prev, option }));
    
    // Recalculate days if option changes
    if (formData.startDate && formData.endDate) {
      updateDaysCount(formData.startDate, formData.endDate, option);
    }
  };

  const handleDateChange = (name) => (date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
    
    // Update number of days when dates change
    if (name === 'startDate' && formData.endDate) {
      updateDaysCount(date, formData.endDate, formData.option);
    } else if (name === 'endDate' && formData.startDate) {
      updateDaysCount(formData.startDate, date, formData.option);
    }
  };
  
  const updateDaysCount = (startDate, endDate, option) => {
    if (!startDate || !endDate) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if end date is before start date
    if (end < start) {
      setError('End date cannot be before start date');
      setFormData(prev => ({ ...prev, noOfDays: '0' }));
      return;
    }
    
    setError('');
    
    // Calculate difference in days
    const diffTime = Math.abs(end - start);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Adjust for half days
    if (option === 'half-day') {
      diffDays = diffDays / 2;
    }
    
    setFormData(prev => ({ ...prev, noOfDays: diffDays.toString() }));
  };

  const handleNext = () => {
    // Validate current step
    if (activeStep === 0 && !formData.leaveType) {
      setError('Please select a leave type');
      return;
    }
    
    if (activeStep === 1) {
      if (!formData.startDate || !formData.endDate) {
        setError('Please select both start and end dates');
        return;
      }
      if (!formData.option) {
        setError('Please select an option (Half Day or Full Day)');
        return;
      }
    }
    
    setError('');
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/staff/leave-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Leave request submitted successfully',
          severity: 'success'
        });
        // Reset form and go back to first step
        setFormData({
          leaveType: '',
          startDate: null,
          endDate: null,
          option: '',
          noOfDays: '',
          reason: '',
        });
        setActiveStep(0);
      } else {
        setError(data.message || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setError('An error occurred while submitting the leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLeaveTypeLabel = (type) => {
    switch (type) {
      case 'sick': return 'Sick Leave';
      case 'casual': return 'Casual Leave';
      case 'annual': return 'Annual Leave';
      default: return '';
    }
  };

  const getOptionLabel = (option) => {
    switch (option) {
      case 'half-day': return 'Half Day';
      case 'full-day': return 'Full Day';
      default: return '';
    }
  };
  
  const getLeaveTypeBadgeColor = (type) => {
    switch (type) {
      case 'sick': return 'error';
      case 'casual': return 'primary';
      case 'annual': return 'success';
      default: return 'default';
    }
  };
  
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isStepComplete = (step) => {
    switch (step) {
      case 0:
        return !!formData.leaveType;
      case 1:
        return !!formData.startDate && !!formData.endDate && !!formData.option;
      case 2:
        return true; // Review step is always complete
      default:
        return false;
    }
  };

  // Step content components
  const LeaveTypeStep = () => (
    <StepContent step={0}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Leave Type
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose the type of leave you want to request
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        {['sick', 'casual', 'annual'].map((type) => (
          <Grid item xs={12} sm={4} key={type}>
            <LeaveTypeButton
              fullWidth
              variant="outlined"
              selected={formData.leaveType === type}
              leaveType={type}
              onClick={() => handleLeaveTypeSelect(type)}
              startIcon={<LeaveTypeIcon type={type} />}
            >
              {getLeaveTypeLabel(type)}
            </LeaveTypeButton>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Chip 
                size="small" 
                label={`${leaveBalance[type]} days remaining`} 
                color={getLeaveTypeBadgeColor(type)} 
                variant="outlined"
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </StepContent>
  );

  const DateSelectionStep = () => (
    <StepContent step={1}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Date Range
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose your leave start and end dates
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Start Date"
            value={formData.startDate}
            onChange={handleDateChange('startDate')}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarIcon color="primary" />
                    </InputAdornment>
                  ),
                }
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="End Date"
            value={formData.endDate}
            onChange={handleDateChange('endDate')}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarIcon color="primary" />
                    </InputAdornment>
                  ),
                }
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            Duration Options
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant={formData.option === 'half-day' ? 'contained' : 'outlined'}
                onClick={() => handleOptionSelect('half-day')}
                sx={{ py: 1.5 }}
              >
                Half Day
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant={formData.option === 'full-day' ? 'contained' : 'outlined'}
                onClick={() => handleOptionSelect('full-day')}
                sx={{ py: 1.5 }}
              >
                Full Day
              </Button>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Total Leave Days"
            name="noOfDays"
            value={formData.noOfDays}
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <HourglassIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Chip 
                    label="days" 
                    size="small" 
                    variant="outlined" 
                    color="primary"
                  />
                </InputAdornment>
              ),
            }}
            sx={{ mt: 2 }}
          />
        </Grid>
      </Grid>
    </StepContent>
  );

  const ReviewSubmitStep = () => (
    <StepContent step={2}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Review Your Request
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Please verify the details before submitting
        </Typography>
      </Box>
      
      <StyledPaper elevation={0} sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LeaveTypeIcon type={formData.leaveType} />
              <Typography variant="subtitle1" sx={{ ml: 1 }}>
                {getLeaveTypeLabel(formData.leaveType)}
              </Typography>
              <Chip 
                size="small" 
                label={formData.noOfDays + ' days'} 
                color={getLeaveTypeBadgeColor(formData.leaveType)} 
                sx={{ ml: 'auto' }} 
              />
            </Box>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Start Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formatDate(formData.startDate)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              End Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formatDate(formData.endDate)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Option
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {getOptionLabel(formData.option)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Available Balance
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {leaveBalance[formData.leaveType]} days
            </Typography>
          </Grid>
        </Grid>
      </StyledPaper>
      
      <TextField
        fullWidth
        label="Reason for Leave (Optional)"
        name="reason"
        value={formData.reason}
        onChange={handleChange}
        multiline
        rows={3}
        placeholder="Please provide details about your leave request..."
        sx={{ mb: 3 }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip 
          icon={<InfoIcon />} 
          label={`Remaining balance after approval: ${Math.max(0, leaveBalance[formData.leaveType] - parseFloat(formData.noOfDays))} days`} 
          color="primary" 
          variant="outlined" 
        />
      </Box>
    </StepContent>
  );

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', padding: 2 }}>
      <Card sx={{ mb: 4, backgroundColor: theme.palette.primary.main, color: 'white' }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Leave Request
          </Typography>
          <Typography variant="body1">
            Request time off for personal, medical, or vacation purposes
          </Typography>
        </CardContent>
      </Card>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <StyledPaper>
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel={!isMobile}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{ mb: 4 }}
        >
          <Step completed={isStepComplete(0)}>
            <StepLabel>Select Type</StepLabel>
          </Step>
          <Step completed={isStepComplete(1)}>
            <StepLabel>Choose Dates</StepLabel>
          </Step>
          <Step completed={isStepComplete(2)}>
            <StepLabel>Review & Submit</StepLabel>
          </Step>
        </Stepper>
        
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
          {activeStep === 0 && <LeaveTypeStep />}
          {activeStep === 1 && <DateSelectionStep />}
          {activeStep === 2 && <ReviewSubmitStep />}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
            
            {activeStep === 2 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                endIcon={isSubmitting ? <HourglassIcon /> : <SendIcon />}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                type="submit"
                endIcon={<CheckCircleIcon />}
              >
                {activeStep === 0 ? 'Continue' : 'Review Request'}
              </Button>
            )}
          </Box>
        </form>
      </StyledPaper>

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
  );
};

export default LeaveRequestForm;
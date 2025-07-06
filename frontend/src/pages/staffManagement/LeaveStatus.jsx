import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  DataGrid, 
  GridActionsCellItem,
  GridToolbar 
} from '@mui/x-data-grid';
import { 
  Box, 
  Typography, 
  Chip, 
  Card, 
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Tooltip,
  CircularProgress,
  Stack,
  Divider,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CalendarToday as CalendarIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  BugReport as SickIcon,
  BeachAccess as CasualIcon,
  Event as AnnualIcon,
  EventBusy as CancelledIcon,
  InfoOutlined as InfoIcon
} from '@mui/icons-material';

const LeaveStatus = () => {
  const { token } = useAuth();
  const theme = useTheme();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0
  });

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error';
    }
  };

  const getLeaveTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'sick':
        return <SickIcon fontSize="small" color="error" />;
      case 'casual':
        return <CasualIcon fontSize="small" color="primary" />;
      case 'annual':
        return <AnnualIcon fontSize="small" color="success" />;
      default:
        return <CalendarIcon fontSize="small" color="action" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <ApprovedIcon fontSize="small" color="success" />;
      case 'rejected':
        return <RejectedIcon fontSize="small" color="error" />;
      case 'cancelled':
        return <CancelledIcon fontSize="small" color="error" />;
      case 'pending':
      default:
        return <PendingIcon fontSize="small" color="warning" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'error';
      case 'pending':
      default:
        return 'warning';
    }
  };

  const getLeaveTypeLabel = (type) => {
    switch (type?.toLowerCase()) {
      case 'sick': return 'Sick Leave';
      case 'casual': return 'Casual Leave';
      case 'annual': return 'Annual Leave';
      default: return type || '';
    }
  };

  const getLeaveTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'sick': return 'error';
      case 'casual': return 'primary';
      case 'annual': return 'success';
      default: return 'default';
    }
  };

  useEffect(() => {
    fetchLeaveStatus();
  }, [token]);

  useEffect(() => {
    // Calculate statistics
    const total = leaveRequests.length;
    const pending = leaveRequests.filter(req => req.status?.toLowerCase() === 'pending').length;
    const approved = leaveRequests.filter(req => req.status?.toLowerCase() === 'approved').length;
    const rejected = leaveRequests.filter(req => req.status?.toLowerCase() === 'rejected').length;
    const cancelled = leaveRequests.filter(req => req.status?.toLowerCase() === 'cancelled').length;

    setStats({
      total,
      pending,
      approved,
      rejected,
      cancelled
    });
  }, [leaveRequests]);

  const fetchLeaveStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/staff/leave-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      // Add unique id if _id is not available
      const processedData = data.map(item => ({
        ...item,
        id: item._id || Math.random().toString()
      }));
      setLeaveRequests(processedData);
    } catch (error) {
      console.error('Error fetching leave status:', error);
      showSnackbar('Failed to load leave requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
  try {
    setDeleteLoading(true);
    
    const response = await fetch(`/api/staff/leave-request/${selectedRequest._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete leave request');
    }
    
    // Update local state to remove the deleted request
    setLeaveRequests(prevRequests => 
      prevRequests.filter(request => request._id !== selectedRequest._id)
    );
    
    // Show success message
    showSnackbar('Leave request deleted successfully');
    
    // Close the dialog
    setOpenDeleteDialog(false);
    
  } catch (error) {
    console.error('Error deleting leave request:', error);
    showSnackbar(error.message || 'Failed to delete request', 'error');
  } finally {
    setDeleteLoading(false);
  }
};

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setOpenDetailsDialog(true);
  };

  const handleDeleteClick = (request) => {
    setSelectedRequest(request);
    setOpenDeleteDialog(true);
  };

  const StatCard = ({ title, count, icon, color }) => (
    <Card sx={{ 
      height: '100%', 
      borderLeft: `4px solid ${theme.palette[color].main}`,
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 3
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="text.secondary">{title}</Typography>
          <Box sx={{ 
            bgcolor: alpha(theme.palette[color].main, 0.1), 
            p: 1, 
            borderRadius: '50%' 
          }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>{count}</Typography>
      </CardContent>
    </Card>
  );

  const columns = [
    { 
      field: 'leaveType', 
      headerName: 'Leave Type', 
      flex: 1, 
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getLeaveTypeIcon(params.value)}
          <Chip 
            label={getLeaveTypeLabel(params.value)} 
            size="small" 
            color={getLeaveTypeColor(params.value)}
            variant="outlined"
          />
        </Box>
      ),
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      flex: 1, 
      minWidth: 120,
      valueGetter: (params) => formatDate(params.row.startDate),
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      flex: 1, 
      minWidth: 120,
      valueGetter: (params) => formatDate(params.row.endDate),
    },
    {
      field: 'noOfDays',
      headerName: 'Days',
      type: 'number',
      width: 80,
      valueGetter: (params) => params.row.noOfDays || 'N/A',
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 140,
      renderCell: (params) => (
        <Chip 
          icon={getStatusIcon(params.value)}
          label={params.value} 
          size="small"
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="View Details">
              <ViewIcon />
            </Tooltip>
          }
          label="View"
          onClick={() => handleViewDetails(params.row)}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title={params.row.status?.toLowerCase() === 'pending' ? 'Cancel Request' : 'Cannot Cancel'}>
              <DeleteIcon color={params.row.status?.toLowerCase() === 'pending' ? 'error' : 'disabled'} />
            </Tooltip>
          }
          label="Delete"
          onClick={() => handleDeleteClick(params.row)}
          disabled={params.row.status?.toLowerCase() !== 'pending'}
          showInMenu={false}
        />,
      ],
    },
  ];

  const LeaveDetailsDialog = () => (
    <Dialog
      open={openDetailsDialog}
      onClose={() => setOpenDetailsDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      {selectedRequest && (
        <>
          <DialogTitle sx={{ 
            bgcolor: theme.palette[getLeaveTypeColor(selectedRequest.leaveType)].main, 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            {getLeaveTypeIcon(selectedRequest.leaveType)}
            Leave Request Details
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {getLeaveTypeLabel(selectedRequest.leaveType)}
              </Typography>
              <Chip 
                icon={getStatusIcon(selectedRequest.status)}
                label={selectedRequest.status} 
                color={getStatusColor(selectedRequest.status)}
              />
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <DetailItem title="Start Date" value={formatDate(selectedRequest.startDate)} />
              <DetailItem title="End Date" value={formatDate(selectedRequest.endDate)} />
              <DetailItem title="Duration" value={`${selectedRequest.noOfDays || 'N/A'} days`} />
              <DetailItem title="Option" value={selectedRequest.option === 'half-day' ? 'Half Day' : 'Full Day'} />
              
              {selectedRequest.approvedBy && (
                <DetailItem title="Approved By" value={selectedRequest.approvedBy} />
              )}
              {selectedRequest.approvedDate && (
                <DetailItem title="Approved On" value={formatDate(selectedRequest.approvedDate)} />
              )}
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
                <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.7), mt: 1 }}>
                  <Typography variant="body2">
                    {selectedRequest.reason || 'No reason provided'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenDetailsDialog(false)}
            >
              Close
            </Button>
            {selectedRequest.status?.toLowerCase() === 'pending' && (
              <Button 
                startIcon={<DeleteIcon />}
                color="error"
                onClick={() => {
                  setOpenDetailsDialog(false);
                  handleDeleteClick(selectedRequest);
                }}
              >
                Cancel Request
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  const Grid = ({ container, item, xs, children, spacing, ...rest }) => {
    if (container) {
      return (
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(12, 1fr)', 
            gap: spacing ? theme.spacing(spacing) : 0,
            ...rest 
          }}
        >
          {children}
        </Box>
      );
    }
    return (
      <Box 
        sx={{ 
          gridColumn: `span ${xs || 12}`,
          ...rest
        }}
      >
        {children}
      </Box>
    );
  };

  const DetailItem = ({ title, value }) => (
    <Grid item xs={6}>
      <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
      <Typography variant="body1" sx={{ mt: 0.5 }}>{value}</Typography>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Card sx={{ mb: 4, bgcolor: theme.palette.primary.main, color: 'white' }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Leave Request Status
          </Typography>
          <Typography variant="body1">
            Track and manage your leave applications
          </Typography>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Total Requests" 
            count={stats.total} 
            icon={<InfoIcon color="primary" fontSize="large" />} 
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Pending" 
            count={stats.pending} 
            icon={<PendingIcon color="warning" fontSize="large" />} 
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Approved" 
            count={stats.approved} 
            icon={<ApprovedIcon color="success" fontSize="large" />} 
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard 
            title="Rejected/Cancelled" 
            count={stats.rejected + stats.cancelled} 
            icon={<RejectedIcon color="error" fontSize="large" />} 
            color="error"
          />
        </Grid>
      </Grid>

      <Paper 
        elevation={0} 
        sx={{ 
          height: 550, 
          width: '100%', 
          p: 2,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={leaveRequests}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
            autoHeight
            density="standard"
            components={{
              Toolbar: GridToolbar,
            }}
            componentsProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            sx={{
              '& .MuiDataGrid-row:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
              },
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              border: 'none',
            }}
          />
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => !deleteLoading && setOpenDeleteDialog(false)}
      >
        <DialogTitle>Cancel Leave Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this leave request? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            disabled={deleteLoading}
          >
            No, Keep It
          </Button>
          <Button 
            onClick={handleDeleteRequest} 
            color="error" 
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Cancelling...' : 'Yes, Cancel It'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <LeaveDetailsDialog />

      {/* Snackbar for notifications */}
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

export default LeaveStatus;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Badge,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Tooltip,
  Fade,
  Backdrop,
  Modal,
  Button
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  Done as DoneIcon,
  HourglassEmpty as PendingIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import api from '../../services/api';

const TaskList = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [openTaskDetails, setOpenTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    highPriority: 0
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/staff/tasks');
        setTasks(response.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    // Calculate statistics
    const today = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < today && task.status === 'pending';
    }).length;
    const highPriorityTasks = tasks.filter(task => task.priorityLevel === 'high').length;
    
    setStats({
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      highPriority: highPriorityTasks
    });

    // Apply filters based on current tab and search query
    filterTasks(tabValue, searchQuery);
  }, [tasks, tabValue, searchQuery]);

  const filterTasks = (tab, query) => {
    const today = new Date();
    let filtered = [...tasks];
    
    // Filter by tab
    if (tab === 1) {
      filtered = filtered.filter(task => task.status === 'pending');
    } else if (tab === 2) {
      filtered = filtered.filter(task => task.status === 'completed');
    } else if (tab === 3) {
      filtered = filtered.filter(task => {
        if (!task.dueDate || task.status === 'completed') return false;
        const dueDate = new Date(task.dueDate);
        return dueDate < today && task.status === 'pending';
      });
    }
    
    // Filter by search query
    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      filtered = filtered.filter(task => 
        task.taskTitle.toLowerCase().includes(lowerCaseQuery) || 
        task.taskDescription.toLowerCase().includes(lowerCaseQuery)
      );
    }
    
    setFilteredTasks(filtered);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleMarkCompleted = async (taskId) => {
    try {
      setLoading(true);
      const response = await api.put(`/staff/tasks/${taskId}/complete`);
      if (response.data && response.data.task) {
        setTasks(tasks.map(task => task._id === taskId ? response.data.task : task));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error marking task as completed:', error);
      setError('Failed to update task status. Please try again.');
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setOpenTaskDetails(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status, dueDate) => {
    if (status === 'completed') {
      return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
    } else if (isOverdue(dueDate, status)) {
      return <FlagIcon sx={{ color: '#f44336' }} />;
    } else {
      return <PendingIcon sx={{ color: '#9e9e9e' }} />;
    }
  };

  const getTaskProgress = (task) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getStatusIcon(task.status, task.dueDate)}
        <Typography variant="body2" color={isOverdue(task.dueDate, task.status) ? 'error' : 'text.secondary'}>
          {task.status === 'completed' ? 'Completed' : isOverdue(task.dueDate, task.status) ? 'Overdue' : 'In Progress'}
        </Typography>
      </Box>
    );
  };

  const StatusCard = ({ title, count, color, icon }) => (
    <Card sx={{ borderLeft: `4px solid ${color}`, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="text.secondary">{title}</Typography>
          {icon}
        </Box>
        <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>{count}</Typography>
      </CardContent>
    </Card>
  );

  const TaskCard = ({ task }) => (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer', 
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        },
        borderLeft: `4px solid ${getPriorityColor(task.priorityLevel)}`
      }}
      onClick={() => handleTaskClick(task)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6">{task.taskTitle}</Typography>
          <Chip
            label={task.priorityLevel}
            size="small"
            sx={{
              backgroundColor: getPriorityColor(task.priorityLevel),
              color: 'white',
              textTransform: 'capitalize'
            }}
          />
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mt: 1, 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {task.taskDescription}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Due: {formatDate(task.dueDate)}
            </Typography>
          </Box>
          {getTaskProgress(task)}
        </Box>
        
        {task.status === 'pending' && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Tooltip title="Mark as completed">
              <IconButton 
                size="small" 
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkCompleted(task._id);
                }}
              >
                <DoneIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const TaskDetailsModal = () => (
    <Modal
      open={openTaskDetails}
      onClose={() => setOpenTaskDetails(false)}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={openTaskDetails}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: {xs: '90%', sm: '80%', md: '60%'},
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          {selectedTask && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">{selectedTask.taskTitle}</Typography>
                <Chip
                  label={selectedTask.priorityLevel}
                  size="small"
                  sx={{
                    backgroundColor: getPriorityColor(selectedTask.priorityLevel),
                    color: 'white',
                    textTransform: 'capitalize'
                  }}
                />
              </Box>
              
              <Typography variant="body1" paragraph>
                {selectedTask.taskDescription}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    {getStatusIcon(selectedTask.status, selectedTask.dueDate)}
                    <Typography>
                      {selectedTask.status === 'completed' ? 'Completed' : isOverdue(selectedTask.dueDate, selectedTask.status) ? 'Overdue' : 'In Progress'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                  <Typography sx={{ mt: 0.5 }}>{formatDate(selectedTask.dueDate)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                  <Typography sx={{ mt: 0.5 }}>{formatDate(selectedTask.startDate)}</Typography>
                </Grid>
              </Grid>
              
              {selectedTask.status === 'pending' && (
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      handleMarkCompleted(selectedTask._id);
                      setOpenTaskDetails(false);
                    }}
                    startIcon={<DoneIcon />}
                  >
                    Mark as Completed
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Fade>
    </Modal>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Task Dashboard
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {loading && tasks.length === 0 ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <StatusCard 
                title="Total Tasks" 
                count={stats.total} 
                color="#2196f3" 
                icon={<InfoIcon color="primary" />} 
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatusCard 
                title="Pending" 
                count={stats.pending} 
                color="#ff9800" 
                icon={<PendingIcon sx={{ color: '#ff9800' }} />} 
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatusCard 
                title="Completed" 
                count={stats.completed} 
                color="#4caf50" 
                icon={<CheckCircleIcon sx={{ color: '#4caf50' }} />} 
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Badge badgeContent={stats.overdue} color="error" invisible={stats.overdue === 0}>
                <StatusCard 
                  title="Overdue" 
                  count={stats.overdue} 
                  color="#f44336" 
                  icon={<FlagIcon sx={{ color: '#f44336' }} />} 
                />
              </Badge>
            </Grid>
          </Grid>
          
          {/* Search and Filters */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3, gap: 2 }}>
            <TextField
              placeholder="Search tasks..."
              variant="outlined"
              size="small"
              fullWidth
              sx={{ maxWidth: { sm: '300px' } }}
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                minHeight: '40px',
                '& .MuiTab-root': {
                  minHeight: '40px',
                  textTransform: 'none'
                }
              }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>All</span>
                    <Chip label={stats.total} size="small" />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Pending</span>
                    <Chip label={stats.pending} size="small" color="warning" />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Completed</span>
                    <Chip label={stats.completed} size="small" color="success" />
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Overdue</span>
                    <Chip label={stats.overdue} size="small" color="error" />
                  </Box>
                } 
              />
            </Tabs>
          </Box>
          
          {/* Tasks Grid */}
          {filteredTasks.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <Typography color="text.secondary">
                {tasks.length === 0 ? 'No tasks assigned yet.' : 'No tasks match your filters.'}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredTasks.map((task) => (
                <Grid item xs={12} md={6} lg={4} key={task._id}>
                  <TaskCard task={task} />
                </Grid>
              ))}
            </Grid>
          )}
          
          <TaskDetailsModal />
        </>
      )}
    </Box>
  );
};

export default TaskList;
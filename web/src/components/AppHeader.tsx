import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Box from '@mui/material/Box';
import { Link } from '@tanstack/react-router';
import { useAuth, useLogoutMutation } from '../hooks/useAuth';
import { useDashboardVersion } from '../contexts/DashboardVersionContext';
import { tokens } from '../../../shared/theme/tokens';

export default function AppHeader() {
  const { user } = useAuth();
  const logoutMutation = useLogoutMutation();
  const { version, toggle } = useDashboardVersion();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = '/login';
      },
    });
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: `linear-gradient(90deg, ${tokens.colors.secondary}, ${tokens.colors.primary})`,
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ mr: 2, color: 'white' }}>
          EHE Signal
        </Typography>
        {user && (
          <>
            <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
              <Button color="inherit" component={Link} to="/dashboard">
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/posts">
                Posts
              </Button>
              <Button color="inherit" component={Link} to="/jobs">
                Jobs
              </Button>
              {user.isAdmin && (
                <Button color="inherit" component={Link} to="/admin">
                  Admin
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ToggleButtonGroup
                value={version}
                exclusive
                onChange={() => toggle()}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    color: 'rgba(255,255,255,0.7)',
                    borderColor: 'rgba(255,255,255,0.3)',
                    py: 0.25,
                    px: 1,
                    fontSize: '0.75rem',
                    '&.Mui-selected': {
                      color: 'white',
                      bgcolor: 'rgba(255,255,255,0.2)',
                    },
                  },
                }}
              >
                <ToggleButton value="A">A</ToggleButton>
                <ToggleButton value="B">B</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {user.email}
              </Typography>
              <Button color="inherit" onClick={handleLogout} disabled={logoutMutation.isPending}>
                Logout
              </Button>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

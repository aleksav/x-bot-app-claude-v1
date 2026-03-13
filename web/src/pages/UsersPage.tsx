import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import TablePagination from '@mui/material/TablePagination';
import AppHeader from '../components/AppHeader';
import { useUsers, useUpdateUserPassword } from '../hooks/useUsers';
import { AxiosError } from 'axios';

export default function UsersPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const { data, isLoading, error } = useUsers(page + 1, pageSize);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string } | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const updatePasswordMutation = useUpdateUserPassword();

  const handleOpenDialog = (user: { id: string; email: string }) => {
    setSelectedUser(user);
    setPassword('');
    setPasswordError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setPassword('');
    setPasswordError(null);
  };

  const handleSavePassword = () => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (!selectedUser) return;

    updatePasswordMutation.mutate(
      { id: selectedUser.id, password },
      {
        onSuccess: () => {
          setSnackbar({
            open: true,
            message: 'Password updated successfully',
            severity: 'success',
          });
          handleCloseDialog();
        },
        onError: (err) => {
          let message = 'Failed to update password';
          if (err instanceof AxiosError && err.response?.data?.error) {
            message = err.response.data.error;
          }
          setSnackbar({ open: true, message, severity: 'error' });
        },
      },
    );
  };

  return (
    <Box>
      <AppHeader />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 3 }}>
          Users
        </Typography>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load users
          </Alert>
        )}

        {data && (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenDialog({ id: user.id, email: user.email })}
                        >
                          Change Password
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={data.meta.total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Change Password for {selectedUser?.email}</DialogTitle>
          <DialogContent>
            <TextField
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(null);
              }}
              error={!!passwordError}
              helperText={passwordError}
              fullWidth
              sx={{ mt: 1 }}
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSavePassword}
              variant="contained"
              disabled={updatePasswordMutation.isPending}
            >
              {updatePasswordMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

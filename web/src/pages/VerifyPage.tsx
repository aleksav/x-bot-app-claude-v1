import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { apiClient } from '../lib/apiClient';

export default function VerifyPage() {
  const hasRun = useRef(false);
  const errorRef = useRef<string | null>(null);
  const loadingRef = useRef(true);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      errorRef.current = 'No verification token provided';
      loadingRef.current = false;
      return;
    }

    apiClient
      .get(`/auth/verify?token=${encodeURIComponent(token)}`)
      .then(() => {
        window.location.href = '/dashboard';
      })
      .catch(() => {
        errorRef.current = 'Verification failed. The link may have expired.';
        loadingRef.current = false;
      });
  }, []);

  // Since the verify endpoint redirects, the browser follows it.
  // We just show a loading state.
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        {errorRef.current ? (
          <Alert severity="error">{errorRef.current}</Alert>
        ) : (
          <>
            <CircularProgress />
            <Typography variant="body1" color="text.secondary">
              Verifying your login...
            </Typography>
          </>
        )}
      </Box>
    </Container>
  );
}

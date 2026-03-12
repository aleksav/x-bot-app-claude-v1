import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function App() {
  return (
    <Container maxWidth="md">
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
        <Typography variant="h2" component="h1" color="primary" fontWeight={700}>
          X Bot Platform
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and monitor your X (Twitter) bots from one place.
        </Typography>
      </Box>
    </Container>
  );
}

export default App;

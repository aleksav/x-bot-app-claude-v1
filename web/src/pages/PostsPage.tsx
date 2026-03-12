import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AppHeader from '../components/AppHeader';

export default function PostsPage() {
  return (
    <>
      <AppHeader />
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Posts
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Posts page coming soon
        </Typography>
      </Container>
    </>
  );
}

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import AppHeader from '../components/AppHeader';
import { useJobQueue } from '../hooks/useJobQueue';

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const minutes = Math.round(absDiffMs / 60000);
  const hours = Math.round(absDiffMs / 3600000);
  const days = Math.round(absDiffMs / 86400000);

  if (minutes < 1) {
    return diffMs < 0 ? 'just now' : 'in a moment';
  }
  if (minutes < 60) {
    return diffMs < 0
      ? `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
      : `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  if (hours < 24) {
    return diffMs < 0
      ? `${hours} hour${hours !== 1 ? 's' : ''} ago`
      : `in ${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return diffMs < 0
    ? `${days} day${days !== 1 ? 's' : ''} ago`
    : `in ${days} day${days !== 1 ? 's' : ''}`;
}

function computeDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return '-';
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;
  if (diffMs < 1000) return `${diffMs}ms`;
  const seconds = Math.round(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color?: 'default' | 'info' | 'success' | 'error' | 'warning';
}) {
  const colorMap: Record<string, string> = {
    info: 'info.main',
    success: 'success.main',
    error: 'error.main',
    warning: 'warning.main',
  };
  const textColor = color && color !== 'default' ? colorMap[color] : 'text.primary';

  return (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" color={textColor}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

const statusChipColors: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  pending: 'default',
  locked: 'info',
  completed: 'success',
  failed: 'error',
};

export default function JobQueuePage() {
  const { data, isLoading, error } = useJobQueue();

  if (isLoading) {
    return (
      <>
        <AppHeader />
        <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppHeader />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">Failed to load job queue stats: {error.message}</Alert>
        </Container>
      </>
    );
  }

  if (!data) return null;

  return (
    <>
      <AppHeader />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Job Queue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last completed: {formatRelativeTime(data.lastCompletedAt)} | Next scheduled:{' '}
            {formatRelativeTime(data.nextScheduledAt)}
          </Typography>
        </Box>

        {/* Job Counts */}
        <Typography variant="h6" gutterBottom>
          Job Counts
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <StatCard title="Pending" value={data.jobCounts.pending} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Locked" value={data.jobCounts.locked} color="info" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Completed" value={data.jobCounts.completed} color="success" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Failed" value={data.jobCounts.failed} color="error" />
          </Grid>
        </Grid>

        {/* Post Counts */}
        <Typography variant="h6" gutterBottom>
          Post Counts
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <StatCard title="Draft" value={data.postCounts.draft} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Scheduled" value={data.postCounts.scheduled} color="info" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Published" value={data.postCounts.published} color="success" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Discarded" value={data.postCounts.discarded} color="error" />
          </Grid>
        </Grid>

        {/* Upcoming Jobs */}
        <Typography variant="h6" gutterBottom>
          Upcoming Jobs
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bot</TableCell>
                <TableCell>Scheduled At</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.upcomingJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No upcoming jobs
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.upcomingJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>@{job.botHandle}</TableCell>
                    <TableCell>{new Date(job.scheduledAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(job.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Recent Jobs */}
        <Typography variant="h6" gutterBottom>
          Recent Jobs
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bot</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Started At</TableCell>
                <TableCell>Completed At</TableCell>
                <TableCell>Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recentJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No recent jobs
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.recentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>@{job.botHandle}</TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        color={statusChipColors[job.status] ?? 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {job.startedAt ? new Date(job.startedAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      {job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>{computeDuration(job.startedAt, job.completedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Recent Errors - only show if there are errors */}
        {data.recentErrors.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom color="error">
              Recent Errors
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'error.50' }}>
                    <TableCell>Bot</TableCell>
                    <TableCell>Scheduled At</TableCell>
                    <TableCell>Failed At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentErrors.map((job) => (
                    <TableRow key={job.id} sx={{ bgcolor: 'rgba(211, 47, 47, 0.04)' }}>
                      <TableCell>
                        <Chip
                          label={`@${job.botHandle}`}
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{new Date(job.scheduledAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Container>
    </>
  );
}

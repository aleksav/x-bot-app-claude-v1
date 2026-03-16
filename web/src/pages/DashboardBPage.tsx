import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BarChartIcon from '@mui/icons-material/BarChart';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import AppHeader from '../components/AppHeader';
import BotSetupForm from '../components/BotSetupForm';
import { useBot, useCreateBot, useUpdateBot, useGenerateDrafts } from '../hooks/useBot';
import { useAuth } from '../hooks/useAuth';
import { usePosts, usePostCounts, useUpdatePost, useDeletePost } from '../hooks/usePosts';
import { useStats } from '../hooks/useStats';
import { apiClient } from '../lib/apiClient';
import { useNavigate } from '@tanstack/react-router';

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
  action?: React.ReactNode;
};

export default function DashboardBPage() {
  const { user } = useAuth();
  const { bots, isLoading } = useBot();
  const createBot = useCreateBot();
  const updateBot = useUpdateBot();
  const [selectedBotIndex, setSelectedBotIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });
  const navigate = useNavigate();

  const bot = bots.length > 0 ? bots[Math.min(selectedBotIndex, bots.length - 1)] : null;

  const generateDrafts = useGenerateDrafts();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const { data: statsData } = useStats(bot?.id);
  const { data: counts } = usePostCounts();
  const { data: recentPublishedData, isLoading: recentPublishedLoading } = usePosts(
    'published',
    1,
    5,
  );
  const { data: draftsData, isLoading: draftsLoading } = usePosts('draft', 1, 3);

  const recentPublished = recentPublishedData?.data ?? [];
  const drafts = draftsData?.data ?? [];
  const draftCount = counts?.draft ?? 0;

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error',
    action?: React.ReactNode,
  ) => {
    setSnackbar({ open: true, message, severity, action });
  };

  const handleToggleClick = () => {
    if (!bot) return;
    setToggleConfirmOpen(true);
  };

  const handleToggleConfirm = () => {
    if (!bot) return;
    const newActive = !bot.active;
    setToggleConfirmOpen(false);
    updateBot.mutate(
      { id: bot.id, active: newActive },
      {
        onSuccess: () => showSnackbar(newActive ? 'Bot resumed' : 'Bot paused', 'success'),
        onError: () => showSnackbar('Failed to update bot', 'error'),
      },
    );
  };

  const handleConnectX = async () => {
    if (!bot) return;
    setConnectLoading(true);
    try {
      const response = await apiClient.get<{ data: { url: string } }>(
        `/auth/x/connect?botId=${bot.id}`,
      );
      window.location.href = response.data.data.url;
    } catch {
      setConnectLoading(false);
    }
  };

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

  if (!bot) {
    return (
      <>
        <AppHeader />
        <Container maxWidth="sm" sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Set up your bot
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Configure your bot&apos;s posting behaviour. You can connect your X account afterwards.
          </Typography>
          <BotSetupForm
            onSubmit={(values) => {
              createBot.mutate(values);
            }}
            isLoading={createBot.isPending}
            submitLabel="Create Bot"
          />
        </Container>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
        {/* Bot Status Bar */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {bots.length > 1 && (
                  <Select
                    size="small"
                    value={selectedBotIndex}
                    onChange={(e) => setSelectedBotIndex(Number(e.target.value))}
                    sx={{ minWidth: 180 }}
                  >
                    {bots.map((b, i) => (
                      <MenuItem key={b.id} value={i}>
                        @{b.xAccountHandle || `Bot ${i + 1}`}
                        {!b.active && ' (paused)'}
                        {b.userId !== user?.id && b.user
                          ? ` (${b.user.name})`
                          : b.userId !== user?.id
                            ? ' (Shared)'
                            : ''}
                      </MenuItem>
                    ))}
                  </Select>
                )}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  @{bot.xAccountHandle || 'Not connected'}
                </Typography>
                <Chip
                  label={bot.active ? 'Active' : 'Paused'}
                  color={bot.active ? 'success' : 'default'}
                  size="small"
                />
                <Switch
                  checked={bot.active}
                  onChange={handleToggleClick}
                  disabled={updateBot.isPending}
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleConnectX}
                  disabled={connectLoading}
                >
                  {connectLoading ? 'Connecting...' : 'Connect X'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => void navigate({ to: `/bots/${bot.id}/edit` })}
                >
                  Edit Config
                </Button>
                <Button size="small" variant="outlined" onClick={() => setCreateOpen(true)}>
                  + New Bot
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 3-column cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Next Scheduled */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ScheduleIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2">Next Scheduled</Typography>
                </Box>
                {statsData ? (
                  statsData.postsByStatus.scheduled > 0 ? (
                    <Typography variant="h4">{statsData.postsByStatus.scheduled}</Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No scheduled posts
                    </Typography>
                  )
                ) : (
                  <Skeleton width={60} height={40} />
                )}
                <Typography variant="caption" color="text.secondary">
                  {statsData ? `${statsData.postsByStatus.approved} approved, waiting` : ''}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Stats Overview */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BarChartIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2">Stats Overview</Typography>
                </Box>
                {statsData ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Published
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {statsData.postsByStatus.published}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Today
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {statsData.postsToday}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Avg Rating
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {statsData.avgPostRating != null ? statsData.avgPostRating.toFixed(1) : '-'}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Skeleton width="100%" height={20} />
                    <Skeleton width="100%" height={20} />
                    <Skeleton width="100%" height={20} />
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <FlashOnIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2">Quick Actions</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    disabled={generateDrafts.isPending}
                    onClick={() => {
                      generateDrafts.mutate(
                        { botId: bot.id, count: 3 },
                        {
                          onSuccess: (result) => {
                            if (result.posts.length === 0 && result.errors.length > 0) {
                              showSnackbar(`Failed: ${result.errors[0]}`, 'error');
                            } else {
                              showSnackbar(
                                `Generated ${result.posts.length} draft(s)`,
                                'success',
                                <Button
                                  color="inherit"
                                  size="small"
                                  onClick={() => void navigate({ to: '/posts' })}
                                >
                                  View Drafts
                                </Button>,
                              );
                            }
                          },
                          onError: () => showSnackbar('Failed to generate drafts', 'error'),
                        },
                      );
                    }}
                  >
                    {generateDrafts.isPending ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        Generating...
                      </>
                    ) : (
                      'Generate Drafts'
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => void navigate({ to: '/posts' })}
                  >
                    View Post Queue
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Published */}
        <Typography variant="h6" gutterBottom>
          Recent Published
        </Typography>
        {recentPublishedLoading ? (
          <Box sx={{ mb: 3 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={36}
                sx={{ mb: 0.5, borderRadius: 1 }}
              />
            ))}
          </Box>
        ) : recentPublished.length === 0 ? (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No published posts yet
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {recentPublished.map((post, index) => (
                <Box
                  key={post.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1,
                    borderBottom: index < recentPublished.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      mr: 2,
                    }}
                  >
                    {post.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pending Drafts Preview */}
        <Typography variant="h6" gutterBottom>
          Pending Drafts ({draftCount})
        </Typography>
        {draftsLoading ? (
          <Box sx={{ mb: 3 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={48}
                sx={{ mb: 0.5, borderRadius: 1 }}
              />
            ))}
          </Box>
        ) : drafts.length === 0 ? (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No drafts pending
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {drafts.map((post, index) => (
                <Box
                  key={post.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1,
                    borderBottom: index < drafts.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {post.content}
                  </Typography>
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() =>
                      updatePost.mutate(
                        { id: post.id, status: 'approved' },
                        {
                          onSuccess: () => showSnackbar('Post approved', 'success'),
                          onError: () => showSnackbar('Failed to approve', 'error'),
                        },
                      )
                    }
                    disabled={updatePost.isPending}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() =>
                      deletePost.mutate(post.id, {
                        onSuccess: () => showSnackbar('Post discarded', 'success'),
                        onError: () => showSnackbar('Failed to discard', 'error'),
                      })
                    }
                    disabled={deletePost.isPending}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              {draftCount > 3 && (
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <Button size="small" onClick={() => void navigate({ to: '/posts' })}>
                    View all {draftCount} drafts
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Toggle confirmation dialog */}
        <Dialog open={toggleConfirmOpen} onClose={() => setToggleConfirmOpen(false)}>
          <DialogTitle>{bot.active ? 'Pause Bot' : 'Resume Bot'}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {bot.active
                ? 'Are you sure you want to pause this bot?'
                : 'Are you sure you want to resume this bot?'}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setToggleConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={handleToggleConfirm}
              variant="contained"
              disabled={updateBot.isPending}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create new bot dialog */}
        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Bot</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <BotSetupForm
                onSubmit={(values) => {
                  createBot.mutate(values, {
                    onSuccess: () => {
                      setCreateOpen(false);
                      setSelectedBotIndex(bots.length);
                      showSnackbar('Bot created', 'success');
                    },
                    onError: () => showSnackbar('Failed to create bot', 'error'),
                  });
                }}
                isLoading={createBot.isPending}
                submitLabel="Create Bot"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)} disabled={createBot.isPending}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={snackbar.action ? 8000 : 4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            action={snackbar.action}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}

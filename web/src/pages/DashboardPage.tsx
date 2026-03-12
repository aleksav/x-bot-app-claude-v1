import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import AppHeader from '../components/AppHeader';
import BotSetupForm from '../components/BotSetupForm';
import { useBot, useUpdateBot } from '../hooks/useBot';
import { apiClient } from '../lib/apiClient';

export default function DashboardPage() {
  const { bot, isLoading } = useBot();
  const updateBot = useUpdateBot();
  const [editOpen, setEditOpen] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  const handleToggleActive = () => {
    if (!bot) return;
    updateBot.mutate({ id: bot.id, active: !bot.active });
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
        <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  if (!bot) {
    return (
      <>
        <AppHeader />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              py: 8,
            }}
          >
            <Typography variant="h4">Set up your bot</Typography>
            <Typography variant="body1" color="text.secondary">
              You don't have a bot yet. Connect your X account to get started.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bot creation requires connecting your X account first via the API.
            </Typography>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h5">@{bot.xAccountHandle || 'Not connected'}</Typography>
                <Chip
                  label={bot.active ? 'Active' : 'Inactive'}
                  color={bot.active ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
              <Switch
                checked={bot.active}
                onChange={handleToggleActive}
                disabled={updateBot.isPending}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Mode: {bot.postMode} | Posts/day: {bot.postsPerDay} | Min interval:{' '}
                {bot.minIntervalHours}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active hours: {bot.preferredHoursStart}:00 - {bot.preferredHoursEnd}:00
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Prompt: {bot.prompt}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="outlined" onClick={handleConnectX} disabled={connectLoading}>
                {connectLoading ? 'Connecting...' : 'Connect X'}
              </Button>
              <Button variant="outlined" onClick={() => setEditOpen(true)}>
                Edit Config
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Bot Configuration</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <BotSetupForm
                initialValues={{
                  prompt: bot.prompt,
                  postMode: bot.postMode as 'auto' | 'manual',
                  postsPerDay: bot.postsPerDay,
                  minIntervalHours: bot.minIntervalHours,
                  preferredHoursStart: bot.preferredHoursStart,
                  preferredHoursEnd: bot.preferredHoursEnd,
                }}
                onSubmit={(values) => {
                  updateBot.mutate(
                    { id: bot.id, ...values },
                    {
                      onSuccess: () => setEditOpen(false),
                    },
                  );
                }}
                isLoading={updateBot.isPending}
                submitLabel="Update"
              />
            </Box>
          </DialogContent>
        </Dialog>
      </Container>
    </>
  );
}

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Rating from '@mui/material/Rating';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagIcon from '@mui/icons-material/Flag';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import RestoreIcon from '@mui/icons-material/Restore';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../hooks/useAuth';
import {
  usePosts,
  usePostCounts,
  useUpdatePost,
  useDeletePost,
  type PostStatus,
} from '../hooks/usePosts';

const STATUS_FILTERS: Array<{ label: string; status?: PostStatus }> = [
  { label: 'All' },
  { label: 'Drafts', status: 'draft' },
  { label: 'Approved', status: 'approved' },
  { label: 'Scheduled', status: 'scheduled' },
  { label: 'Published', status: 'published' },
  { label: 'Discarded', status: 'discarded' },
];

const statusColors: Record<PostStatus, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  draft: 'default',
  approved: 'warning',
  scheduled: 'info',
  published: 'success',
  discarded: 'error',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PostQueueBPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<PostStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data: counts } = usePostCounts(showAll);
  const { data, isLoading } = usePosts(activeFilter, page, 15, showAll);
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  const posts = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 0;

  const handleFilterChange = (status?: PostStatus) => {
    setActiveFilter(status);
    setPage(1);
    setExpandedId(null);
  };

  return (
    <>
      <AppHeader />
      <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Post Queue</Typography>
          {user?.isAdmin && (
            <FormControlLabel
              control={
                <Switch
                  checked={showAll}
                  onChange={(e) => {
                    setShowAll(e.target.checked);
                    setPage(1);
                  }}
                />
              }
              label="Show all bots"
            />
          )}
        </Box>

        {/* Chip filters */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          {STATUS_FILTERS.map((filter) => {
            const count = counts
              ? filter.status
                ? counts[filter.status]
                : counts.total
              : undefined;
            const isActive =
              (filter.status === undefined && activeFilter === undefined) ||
              filter.status === activeFilter;
            return (
              <Chip
                key={filter.label}
                label={count !== undefined ? `${filter.label} (${count})` : filter.label}
                onClick={() => handleFilterChange(filter.status)}
                color={isActive ? 'primary' : 'default'}
                variant={isActive ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            );
          })}
        </Box>

        {/* Post list */}
        {isLoading ? (
          <Box>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={48}
                sx={{ mb: 0.5, borderRadius: 1 }}
              />
            ))}
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No posts found
            </Typography>
          </Box>
        ) : (
          <Card>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {posts.map((post, index) => {
                const isExpanded = expandedId === post.id;
                return (
                  <Box key={post.id}>
                    {/* Compact row */}
                    <Box
                      onClick={() => setExpandedId(isExpanded ? null : post.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        py: 1,
                        gap: 1.5,
                        cursor: 'pointer',
                        borderBottom: index < posts.length - 1 || isExpanded ? '1px solid' : 'none',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Chip
                        label={post.status}
                        color={statusColors[post.status]}
                        size="small"
                        sx={{ minWidth: 80, justifyContent: 'center' }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {post.content.substring(0, 100)}
                        {post.content.length > 100 ? '...' : ''}
                      </Typography>
                      <Rating value={post.rating} readOnly size="small" sx={{ flexShrink: 0 }} />
                      {post.behaviourTitle && (
                        <Chip
                          label={post.behaviourTitle}
                          size="small"
                          variant="outlined"
                          sx={{
                            maxWidth: 120,
                            display: { xs: 'none', md: 'flex' },
                          }}
                        />
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ whiteSpace: 'nowrap', minWidth: 60, textAlign: 'right' }}
                      >
                        {timeAgo(post.createdAt)}
                      </Typography>
                      {/* Inline action icons */}
                      <Box sx={{ display: 'flex', gap: 0.25 }} onClick={(e) => e.stopPropagation()}>
                        {post.status === 'draft' && (
                          <>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => updatePost.mutate({ id: post.id, status: 'approved' })}
                              disabled={updatePost.isPending}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                updatePost.mutate({ id: post.id, status: 'scheduled' })
                              }
                              disabled={updatePost.isPending}
                            >
                              <ScheduleIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                updatePost.mutate({ id: post.id, status: 'discarded' })
                              }
                              disabled={updatePost.isPending}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                        {post.status === 'approved' && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() =>
                                updatePost.mutate({ id: post.id, status: 'scheduled' })
                              }
                              disabled={updatePost.isPending}
                            >
                              <ScheduleIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                updatePost.mutate({ id: post.id, status: 'discarded' })
                              }
                              disabled={updatePost.isPending}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                        {post.status === 'scheduled' && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => updatePost.mutate({ id: post.id, status: 'discarded' })}
                            disabled={updatePost.isPending}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                        {post.status === 'discarded' && (
                          <IconButton
                            size="small"
                            onClick={() => updatePost.mutate({ id: post.id, status: 'draft' })}
                            disabled={updatePost.isPending}
                          >
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          color={post.flagged ? 'warning' : 'default'}
                          onClick={() => updatePost.mutate({ id: post.id, flagged: !post.flagged })}
                          disabled={updatePost.isPending || post.status === 'published'}
                        >
                          {post.flagged ? (
                            <FlagIcon fontSize="small" />
                          ) : (
                            <OutlinedFlagIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Expanded content */}
                    <Collapse in={isExpanded}>
                      <Box
                        sx={{
                          px: 3,
                          py: 2,
                          bgcolor: 'action.hover',
                          borderBottom: index < posts.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                          {post.content}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            flexWrap: 'wrap',
                          }}
                        >
                          {post.behaviourTitle && (
                            <Chip
                              label={`Behaviour: ${post.behaviourTitle}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {post.scheduledAt && (
                            <Typography variant="caption" color="text.secondary">
                              Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                            </Typography>
                          )}
                          {post.publishedAt && (
                            <Typography variant="caption" color="text.secondary">
                              Published: {new Date(post.publishedAt).toLocaleString()}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(post.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          {post.status === 'draft' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() =>
                                  updatePost.mutate({ id: post.id, status: 'approved' })
                                }
                                disabled={updatePost.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() =>
                                  updatePost.mutate({ id: post.id, status: 'scheduled' })
                                }
                                disabled={updatePost.isPending}
                              >
                                Schedule
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={() =>
                                  updatePost.mutate({ id: post.id, status: 'discarded' })
                                }
                                disabled={updatePost.isPending}
                              >
                                Discard
                              </Button>
                            </>
                          )}
                          {post.status === 'approved' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() =>
                                  updatePost.mutate({ id: post.id, status: 'scheduled' })
                                }
                                disabled={updatePost.isPending}
                              >
                                Schedule
                              </Button>
                              <Button
                                size="small"
                                color="warning"
                                variant="outlined"
                                onClick={() => updatePost.mutate({ id: post.id, status: 'draft' })}
                                disabled={updatePost.isPending}
                              >
                                Back to Draft
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={() =>
                                  updatePost.mutate({ id: post.id, status: 'discarded' })
                                }
                                disabled={updatePost.isPending}
                              >
                                Discard
                              </Button>
                            </>
                          )}
                          {post.status === 'scheduled' && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() =>
                                updatePost.mutate({ id: post.id, status: 'discarded' })
                              }
                              disabled={updatePost.isPending}
                            >
                              Discard
                            </Button>
                          )}
                          {post.status === 'discarded' && (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => updatePost.mutate({ id: post.id, status: 'draft' })}
                                disabled={updatePost.isPending}
                              >
                                Reinstate
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={() => deletePost.mutate(post.id)}
                                disabled={deletePost.isPending}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </Box>
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              mt: 2,
            }}
          >
            <Button
              variant="outlined"
              size="small"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Typography variant="body2" color="text.secondary">
              Page {page} of {totalPages}
              {meta ? ` (${meta.total} posts)` : ''}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </Box>
        )}
      </Container>
    </>
  );
}

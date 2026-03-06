import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  MessageSquare, 
  Sparkles, 
  Clock,
  Edit2,
  Check,
  X,
  LogOut,
  KeyRound,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/components/AppLayout';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { getModelById } from '@/lib/models';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { 
    profile, 
    comparisons, 
    stats, 
    isLoading, 
    isOwner, 
    isUploading,
    updateProfile, 
    uploadAvatar,
    sendPasswordReset 
  } = useProfile(userId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleStartEdit = () => {
    setEditName(profile?.display_name || '');
    setEditBio(profile?.bio || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const success = await updateProfile({
      display_name: editName || null,
      bio: editBio || null,
    });
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/chat');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to sign out', variant: 'destructive' });
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    await sendPasswordReset(user.email);
    setIsSendingReset(false);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4 animate-pulse">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Loading profile...</p>
        </main>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium mb-2">Profile not found</h2>
          <p className="text-muted-foreground mb-4">This user doesn't exist or their profile hasn't been created.</p>
          <Link to="/chat">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 relative z-10">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 sm:mb-6"
        >
          <Link to="/chat/community">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Community
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <Card className="p-4 sm:p-6 bg-card border-border">
              <div className="text-center">
                {/* Avatar display (no upload) */}
                <div className="relative inline-block mb-3 sm:mb-4">
                  <div 
                    className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center mx-auto ${
                      profile.avatar_url ? '' : 'bg-gradient-to-br from-primary to-accent'
                    }`}
                  >
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.display_name || 'User avatar'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary-foreground">
                        {(profile.display_name || 'U')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name & Edit */}
                {isEditing ? (
                  <div className="space-y-3 mb-4">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Display name"
                      className="text-center"
                    />
                    <Textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Write a short bio..."
                      className="resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" onClick={handleSaveEdit} className="gap-1">
                        <Check className="h-4 w-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="gap-1">
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h2 className="text-xl font-bold">{profile.display_name || 'Anonymous'}</h2>
                      {isOwner && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleStartEdit}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
                    )}
                  </>
                )}

                {/* Join date */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                <div className="text-center p-2 sm:p-0">
                  <p className="text-xl sm:text-2xl font-bold text-primary">{stats.totalComparisons}</p>
                  <p className="text-xs text-muted-foreground">Comparisons</p>
                </div>
                <div className="text-center p-2 sm:p-0">
                  <p className="text-xl sm:text-2xl font-bold text-accent">{stats.totalDebates}</p>
                  <p className="text-xs text-muted-foreground">Debates</p>
                </div>
                <div className="text-center p-2 sm:p-0">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalVotesReceived}</p>
                  <p className="text-xs text-muted-foreground">Votes Received</p>
                </div>
                <div className="text-center p-2 sm:p-0">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.modelsUsed}</p>
                  <p className="text-xs text-muted-foreground">Models Used</p>
                </div>
              </div>

              {/* Account Actions (Owner only) */}
              {isOwner && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border space-y-2">
                  <Button
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={handlePasswordReset}
                    disabled={isSendingReset}
                  >
                    {isSendingReset ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Reset Password
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sign out?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You will need to sign in again to access your account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout}>Sign Out</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Comparisons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {isOwner ? 'Your Comparisons' : 'Public Comparisons'}
              </h3>
              <span className="text-sm text-muted-foreground">{comparisons.length} shown</span>
            </div>

            {comparisons.length === 0 ? (
              <Card className="p-4 sm:p-8 text-center bg-card border-border">
                <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm sm:text-base">
                  {isOwner ? "You haven't made any comparisons yet." : "No public comparisons yet."}
                </p>
                  {isOwner && (
                    <Link to="/chat">
                      <Button variant="outline" size="sm" className="mt-4">
                        Start Comparing
                      </Button>
                    </Link>
                )}
              </Card>
            ) : (
              <div className="space-y-3">
                {comparisons.map((comparison, index) => (
                  <motion.div
                    key={comparison.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="p-3 sm:p-4 bg-card border-border hover:border-primary/30 transition-colors active:scale-[0.99]">
                      <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2 sm:mb-3">
                        <p className="font-medium text-sm sm:text-base line-clamp-2 flex-1">{comparison.query}</p>
                        {isOwner && !comparison.is_public && (
                          <span className="text-xs px-2 py-1 bg-secondary rounded-full text-muted-foreground">
                            Private
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(comparison.created_at), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {comparison.responses.length} models
                        </span>
                      </div>

                      {/* Model chips */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {comparison.responses.slice(0, 5).map((response, idx) => {
                          const model = AI_MODELS.find(m => m.id === response.model);
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary/50"
                            >
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: model?.color || '#888' }}
                              />
                              {model?.name?.split(' ')[0] || response.model.split('/')[1]}
                            </span>
                          );
                        })}
                        {comparison.responses.length > 5 && (
                          <span className="text-xs text-muted-foreground">
                            +{comparison.responses.length - 5} more
                          </span>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </AppLayout>
  );
}
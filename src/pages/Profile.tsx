import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Profile as ProfileType } from '../types'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'

export default function Profile() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', humor_style: '' })

  const profileId = id || user?.id

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      if (!profileId) return null
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()
        
      if (error) throw error
      
      // Also get counts
      const { count: postsCount } = await supabase.from('videos').select('*', { count: 'exact', head: true }).eq('user_id', profileId)
      const { count: followersCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileId)
      const { count: followingCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileId)

      return {
        ...data,
        posts_count: postsCount || 0,
        followers_count: followersCount || 0,
        following_count: followingCount || 0
      } as ProfileType
    }
  })

  const { data: isFollowing } = useQuery({
    queryKey: ['isFollowing', profileId],
    queryFn: async () => {
      if (!user || user.id === profileId) return false
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', profileId)
        .single()
      return !!data
    },
    enabled: !!user && user.id !== profileId
  })

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profileId) return
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profileId)
      } else {
        await supabase.from('follows').insert([{ follower_id: user.id, following_id: profileId }])
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing', profileId] })
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] })
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      if (!user) return
      await supabase.from('profiles').update(data).eq('id', user.id)
    },
    onSuccess: () => {
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    }
  })

  if (isLoading) return <div className="text-center py-10">Loading profile...</div>
  if (!profile) return <div className="text-center py-10">Profile not found</div>

  const isOwnProfile = user?.id === profile.id

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="text-2xl">{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center sm:text-left space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{profile.full_name || profile.username}</h2>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
            
            <div className="flex justify-center sm:justify-start gap-6 text-sm">
              <div className="text-center"><span className="font-bold block">{profile.posts_count}</span> Posts</div>
              <div className="text-center"><span className="font-bold block">{profile.followers_count}</span> Followers</div>
              <div className="text-center"><span className="font-bold block">{profile.following_count}</span> Following</div>
            </div>
            
            <p className="text-sm">{profile.bio || 'No bio yet.'}</p>
            {profile.humor_style && (
              <p className="text-xs inline-block px-2 py-1 bg-secondary/10 text-secondary rounded">
                Style: {profile.humor_style}
              </p>
            )}

            <div className="pt-2">
              {isOwnProfile ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditForm({ full_name: profile.full_name || '', bio: profile.bio || '', humor_style: profile.humor_style || '' })
                    setIsEditing(!isEditing)
                  }}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
              ) : (
                <Button 
                  onClick={() => followMutation.mutate()}
                  variant={isFollowing ? 'outline' : 'default'}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {isEditing && (
          <CardContent className="border-t pt-6">
            <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(editForm) }} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Humor Style</Label>
                <Input value={editForm.humor_style} onChange={e => setEditForm({...editForm, humor_style: e.target.value})} placeholder="e.g. Dark, Slapstick, Sarcastic" />
              </div>
              <Button type="submit" disabled={updateProfileMutation.isPending}>Save Changes</Button>
            </form>
          </CardContent>
        )}
      </Card>
      
      {/* User's videos could be listed here */}
      <h3 className="text-xl font-bold mt-8 mb-4">Posts</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* We would fetch and map user's videos here. For brevity, leaving placeholder text */}
        <div className="col-span-full text-center text-muted-foreground py-10">
          User videos would appear here.
        </div>
      </div>
    </div>
  )
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Heart, MessageCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Video, Profile } from '../types'
import { useState } from 'react'
import { Input } from '../components/ui/input'

function VideoItem({ video }: { video: Video }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')

  const likeMutation = useMutation({
    mutationFn: async (video: Video) => {
      if (!user) throw new Error('User not authenticated')
      if (video.user_has_liked) {
        await supabase.from('likes').delete().eq('video_id', video.id).eq('user_id', user.id)
      } else {
        await supabase.from('likes').insert([{ video_id: video.id, user_id: user.id }])
      }
    },
    onMutate: async (video: Video) => {
      await queryClient.cancelQueries({ queryKey: ['videos'] })
      const previousVideos = queryClient.getQueryData<Video[]>(['videos'])
      queryClient.setQueryData<Video[]>(['videos'], (old) => {
        if (!old) return old
        return old.map((item) => {
          if (item.id !== video.id) return item
          const liked = !item.user_has_liked
          return {
            ...item,
            user_has_liked: liked,
            likes_count: (item.likes_count ?? 0) + (liked ? 1 : -1)
          }
        })
      })
      return { previousVideos }
    },
    onError: (_err, _video, context) => {
      if (context?.previousVideos) {
        queryClient.setQueryData(['videos'], context.previousVideos)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] })
    }
  })

  const commentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) return
      await supabase.from('comments').insert([{ video_id: video.id, user_id: user.id, content: text }])
    },
    onSuccess: () => {
      setCommentText('')
      queryClient.invalidateQueries({ queryKey: ['comments', video.id] })
      queryClient.invalidateQueries({ queryKey: ['videos'] })
    }
  })

  const { data: comments } = useQuery({
    queryKey: ['comments', video.id],
    queryFn: async () => {
      const { data } = await supabase.from('comments').select('*, profiles(username, avatar_url)').eq('video_id', video.id).order('created_at', { ascending: true })
      return data || []
    },
    enabled: showComments
  })

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center items-start space-y-3 sm:space-y-0 sm:space-x-4 p-4 pb-2">
        <Avatar>
          <AvatarImage src={video.profiles?.avatar_url || ''} />
          <AvatarFallback>{video.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${video.user_id}`} className="text-sm font-semibold hover:underline">
            {video.profiles?.username}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
          </p>
        </div>
        <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium">
          {video.category}
        </span>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="px-4 pb-2">
          <h3 className="font-semibold text-lg">{video.title}</h3>
          {video.description && <p className="text-sm text-muted-foreground">{video.description}</p>}
        </div>
        
        {/* Simple video player / embed. In a real app we'd need to handle different URL types carefully */}
        <div className="bg-black w-full aspect-video relative flex items-center justify-center overflow-hidden">
          {video.video_url.includes('youtube') || video.video_url.includes('youtu.be') ? (
            <iframe 
              className="w-full h-full"
              src={video.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
              allowFullScreen 
            />
          ) : (
            <video 
              src={video.video_url} 
              poster={video.thumbnail || undefined}
              controls 
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col p-4 pt-2">
        <div className="flex w-full space-x-4 mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`space-x-1 ${video.user_has_liked ? 'text-secondary' : ''}`}
            onClick={() => likeMutation.mutate(video)}
          >
            <Heart className={`h-5 w-5 ${video.user_has_liked ? 'fill-current' : ''}`} />
            <span>{video.likes_count}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="space-x-1"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-5 w-5" />
            <span>{video.comments_count}</span>
          </Button>
        </div>

        {showComments && (
          <div className="w-full pt-4 border-t space-y-4">
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {comments?.map(comment => (
                <div key={comment.id} className="flex space-x-2 text-sm">
                  <span className="font-semibold">{comment.profiles?.username}</span>
                  <span>{comment.content}</span>
                </div>
              ))}
            </div>
            <div className="flex space-x-2 pt-2">
              <Input 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    commentMutation.mutate(commentText)
                  }
                }}
              />
              <Button onClick={() => {
                if (commentText.trim()) commentMutation.mutate(commentText)
              }}>Post</Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  
  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['profile-search', search],
    queryFn: async () => {
      const term = search.trim()
      if (!term) return []

      const filters = `%${term}%`
      let query = supabase.from('profiles').select('*').or(`username.ilike.${filters},full_name.ilike.${filters}`)
      if (user?.id) query = query.neq('id', user.id)
      const { data, error } = await query.limit(20)
      if (error) throw error
      return data as Profile[]
    },
    enabled: search.trim().length > 0
  })

  const { data: videos, isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      // Get videos with author profile
      const { data: videosData, error } = await supabase
        .from('videos')
        .select(`
          *,
          profiles(username, avatar_url)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      if (!user || !videosData) return videosData as Video[]

      // Get user likes to check if they liked these videos
      const videoIds = videosData.map(v => v.id)
      const { data: likesData } = await supabase
        .from('likes')
        .select('video_id')
        .eq('user_id', user.id)
        .in('video_id', videoIds)

      const likedVideoIds = new Set(likesData?.map(l => l.video_id) || [])

      return videosData.map(v => ({
        ...v,
        user_has_liked: likedVideoIds.has(v.id)
      })) as Video[]
    }
  })

  if (isLoading) return <div className="text-center py-10">Loading feed...</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search profiles by username or full name"
            className="flex-1"
          />
        </div>

        {search.trim().length > 0 && (
          <Card className="space-y-3">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-lg font-semibold">Search results</h2>
              {isSearching && <span className="text-sm text-muted-foreground">Searching...</span>}
            </div>
            <CardContent className="space-y-2">
              {searchResults?.length ? (
                searchResults.map(profile => (
                  <Link
                    key={profile.id}
                    to={`/profile/${profile.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted transition"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || ''} />
                      <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{profile.full_name || profile.username}</p>
                      <p className="text-xs text-muted-foreground">@{profile.username}</p>
                    </div>
                  </Link>
                ))
              ) : (
                !isSearching && <div className="text-sm text-muted-foreground px-4 pb-3">No users found.</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {videos?.length === 0 ? (
        <div className="text-center py-10">No videos yet. Be the first to post!</div>
      ) : (
        videos?.map(video => (
          <VideoItem key={video.id} video={video} />
        ))
      )}
    </div>
  )
}

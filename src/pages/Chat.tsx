import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Message, Profile } from '../types'
import { formatDistanceToNow } from 'date-fns'

export default function Chat() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch users I follow or who follow me (simplified to all users for demo, ideally we fetch connections)
  const { data: users } = useQuery({
    queryKey: ['chat-users'],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(20)
      if (error) throw error
      return data as Profile[]
    },
    enabled: !!user
  })

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedUser?.id],
    queryFn: async () => {
      if (!user || !selectedUser) return []
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data as Message[]
    },
    enabled: !!user && !!selectedUser
  })

  useEffect(() => {
    if (!user || !selectedUser) return

    const channel = supabase.channel(`chat_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const message = payload.new as Message
          const isRelated = message.sender_id === selectedUser.id || message.receiver_id === selectedUser.id
          if (!isRelated) return

          queryClient.setQueryData(['messages', selectedUser.id], (old: Message[] = []) => {
            const existing = old || []
            if (existing.some(m => m.id === message.id)) return existing
            return [...existing, message]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, selectedUser, queryClient])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !selectedUser) return
      const newMessage = {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content
      }
      // Optimistic update
      const tempId = Date.now().toString()
      queryClient.setQueryData(['messages', selectedUser.id], (old: Message[] = []) => [
        ...old, 
        { ...newMessage, id: tempId, created_at: new Date().toISOString(), read: false } as Message
      ])
      
      await supabase.from('messages').insert([newMessage])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUser?.id] })
    }
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return
    sendMessageMutation.mutate(messageText)
    setMessageText('')
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar: Users List */}
      <Card className="w-1/3 flex flex-col hidden md:flex">
        <CardHeader className="py-4">
          <CardTitle className="text-lg">Messages</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {users?.map(u => (
            <div 
              key={u.id}
              className={`flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-accent/10 transition-colors border-b last:border-0 ${selectedUser?.id === u.id ? 'bg-accent/10 border-r-4 border-r-accent' : ''}`}
            >
              <button
                type="button"
                onClick={() => setSelectedUser(u)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <Avatar>
                  <AvatarImage src={u.avatar_url || ''} />
                  <AvatarFallback>{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <p className="font-medium truncate">{u.full_name || u.username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                </div>
              </button>
              <Link to={`/profile/${u.id}`} className="text-xs text-primary hover:underline whitespace-nowrap">
                View profile
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Main: Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <CardHeader className="py-4 border-b flex flex-row items-center gap-3">
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedUser(null)}>
                ← Back
              </Button>
              <Avatar>
                <AvatarImage src={selectedUser.avatar_url || ''} />
                <AvatarFallback>{selectedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{selectedUser.full_name || selectedUser.username}</CardTitle>
                <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages?.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Send a message to start the conversation!
                </div>
              ) : (
                messages?.map(msg => {
                  const isMine = msg.sender_id === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <span className="text-[10px] opacity-70 mt-1 block text-right">
                          {formatDistanceToNow(new Date(msg.created_at))} ago
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </CardContent>
            <div className="p-4 border-t">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input 
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!messageText.trim() || sendMessageMutation.isPending}>
                  Send
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-2 p-8 text-center md:hidden">
            <h3 className="text-lg font-semibold">Messages</h3>
            <div className="w-full mt-4 flex flex-col gap-2">
              {users?.map(u => (
                <Button key={u.id} variant="outline" className="w-full justify-start h-auto p-3" onClick={() => setSelectedUser(u)}>
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback>{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {u.username}
                </Button>
              ))}
            </div>
          </div>
        )}
        {!selectedUser && (
          <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
            Select a conversation to start chatting
          </div>
        )}
      </Card>
    </div>
  )
}

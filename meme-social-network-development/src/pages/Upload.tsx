import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

const uploadSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  video_url: z.string().url("Must be a valid URL"),
  thumbnail: z.string().url("Must be a valid URL").optional().or(z.literal('')),
})

type UploadFormValues = z.infer<typeof uploadSchema>

export default function Upload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      category: 'funny'
    }
  })

  const onSubmit = async (data: UploadFormValues) => {
    if (!user) return
    try {
      setError(null)
      const { error: insertError } = await supabase.from('videos').insert([
        {
          user_id: user.id,
          title: data.title,
          description: data.description,
          category: data.category,
          video_url: data.video_url,
          thumbnail: data.thumbnail || null,
          status: 'published'
        }
      ])
      
      if (insertError) throw insertError
      
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-accent">Post a new Meme</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-8 text-green-500 font-medium">
              Video uploaded successfully! Redirecting...
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...register("title")} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="video_url">Video URL (YouTube, TikTok, direct link)</Label>
                <Input id="video_url" type="url" placeholder="https://..." {...register("video_url")} />
                {errors.video_url && <p className="text-sm text-destructive">{errors.video_url.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL (Optional)</Label>
                <Input id="thumbnail" type="url" placeholder="https://..." {...register("thumbnail")} />
                {errors.thumbnail && <p className="text-sm text-destructive">{errors.thumbnail.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category" 
                  {...register("category")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="funny">Funny</option>
                  <option value="animals">Animals</option>
                  <option value="gaming">Gaming</option>
                  <option value="reaction">Reaction</option>
                </select>
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...register("description")} />
              </div>
              
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-accent text-black hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? "Publishing..." : "Publish Video"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

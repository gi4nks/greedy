'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, BookOpen, Calendar } from 'lucide-react'
import Link from 'next/link'
import DynamicBreadcrumb from '@/components/ui/dynamic-breadcrumb'

interface GameEdition {
  id: number;
  code: string;
  name: string;
  version: string;
  publisher: string;
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [gameEditions, setGameEditions] = useState<GameEdition[]>([])
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    gameEditionId: number;
  }>({
    title: '',
    description: '',
    status: 'active',
    startDate: '',
    endDate: '',
    gameEditionId: 1, // Default to D&D 5e
  })

  // Fetch available game editions
  useEffect(() => {
    const fetchGameEditions = async () => {
      try {
        const response = await fetch('/api/game-editions')
        if (response.ok) {
          const editions = await response.json()
          setGameEditions(editions)
        }
      } catch (error) {
        console.error('Failed to fetch game editions:', error)
      }
    }

    fetchGameEditions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const campaign = await response.json()
        router.push(`/campaigns/${campaign.id}`)
      } else {
        const error = await response.json()
        console.error('Failed to create campaign:', error)
        // Handle error display here
      }
    } catch (error) {
      console.error('Failed to create campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Breadcrumb */}
      <DynamicBreadcrumb
        items={[
          { label: 'Campaigns', href: '/' },
          { label: 'Create Campaign' }
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Create New Campaign</h1>
            <p className="text-base-content/70">Start a new D&D adventure</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                placeholder="Enter campaign title..."
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameEdition">Game Edition *</Label>
              <Select 
                name="gameEditionId"
                value={formData.gameEditionId.toString()} 
                onValueChange={(value) => handleChange('gameEditionId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select game edition..." />
                </SelectTrigger>
                <SelectContent>
                  {gameEditions.map((edition) => (
                    <SelectItem key={edition.id} value={edition.id.toString()}>
                      {edition.name} ({edition.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-base-content/70">
                Choose the D&D edition for this campaign
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your campaign setting, themes, and goals..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </Button>
              
              <Link href="/campaigns">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
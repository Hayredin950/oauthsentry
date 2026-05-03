"use client"

import { useState } from "react"
import { MessageSquare, Send, User, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TeamComment {
  id: string
  author: string
  avatar?: string
  content: string
  createdAt: string
  mentions?: string[]
}

interface TeamCollaborationProps {
  findingId: string
  linkedTicketUrl?: string
}

export function TeamCollaboration({ findingId, linkedTicketUrl }: TeamCollaborationProps) {
  const [comments, setComments] = useState<TeamComment[]>([
    {
      id: "1",
      author: "Security Team",
      content: "This finding has been escalated. Starting immediate remediation.",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      mentions: ["@incident-response"],
    },
    {
      id: "2",
      author: "DevOps Lead",
      content: "Initiated Context.ai app revocation. Should complete within 30 minutes.",
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      mentions: ["@security-team"],
    },
  ])

  const [newComment, setNewComment] = useState("")
  const [isOpen, setIsOpen] = useState(true) // Show expanded by default

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: TeamComment = {
        id: Math.random().toString(),
        author: "You",
        content: newComment,
        createdAt: new Date().toISOString(),
      }
      setComments([...comments, comment])
      setNewComment("")
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border/40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {comments.length} comments
        {isOpen ? " ▼" : " ▶"}
      </button>

      {isOpen && (
        <div className="space-y-3 rounded-lg bg-muted/40 p-3">
          {/* Comments List */}
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 text-xs">
                <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 flex-shrink">
                  <User className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-semibold text-foreground">{comment.author}</span>
                    <span className="text-muted-foreground">{formatTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-xs text-foreground/90 mt-0.5">{comment.content}</p>
                  {comment.mentions && comment.mentions.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {comment.mentions.map((mention) => (
                        <span
                          key={mention}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-mono text-[10px]"
                        >
                          {mention}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newComment.trim()) {
                  handleAddComment()
                }
              }}
              placeholder="Add a comment... (mention @team)"
              className="flex-1 rounded bg-background px-2 py-1.5 text-xs border border-border/60 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="h-7 w-7 p-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Link to Linear */}
          {linkedTicketUrl && (
            <div className="flex items-center gap-2 rounded bg-background/60 p-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <a
                href={linkedTicketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate"
              >
                View full discussion in Linear
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

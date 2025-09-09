"use client";
import React, { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import type { QMSUpdate, QMSReply } from "@/lib/qmsApi"; // Use QMS specific types
import { supabase } from "@/integrations/supabase/client"; // For getting current user

interface QMSUpdateItemProps {
  update: (QMSUpdate & { replies: QMSReply[] });
  onReply: (updateId: string, body: string, author: string) => Promise<QMSReply | null>;
}

// Helper for relative time
const timeAgo = (d: string | Date) =>
  formatDistanceToNowStrict(new Date(d), { addSuffix: true });

export function QMSUpdateItem({ update, onReply }: QMSUpdateItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const handlePostReply = async () => {
    if (!replyContent.trim()) return;

    setIsReplying(true);
    try {
      const user = await supabase.auth.getUser();
      const authorName = user.data.user?.email || "Anonymous"; // Use email or generic name

      const newReply = await onReply(update.id, replyContent.trim(), authorName);
      if (newReply) {
        setReplyContent("");
        setShowReplyInput(false);
      }
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="flex gap-3 items-start">
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-emerald-100 text-emerald-800">{update.author.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-gray-900">{update.author}</span>
            <span className="text-xs text-gray-500">{timeAgo(update.created_at)}</span>
          </div>
          <p className="text-sm text-gray-700">{update.body}</p>
          <div className="flex items-center gap-3 mt-2 text-gray-500 text-xs">
            <Button variant="ghost" size="sm" className="h-auto p-1 text-gray-600 hover:bg-gray-100">
              <Heart className="w-3 h-3 mr-1" /> Like
            </Button>
            <Button variant="ghost" size="sm" className="h-auto p-1 text-gray-600 hover:bg-gray-100" onClick={() => setShowReplyInput(prev => !prev)}>
              <MessageSquare className="w-3 h-3 mr-1" /> Reply
            </Button>
          </div>
        </div>

        {/* Threaded Replies */}
        {update.replies.length > 0 && (
          <div className="ml-10 mt-2 space-y-2">
            {update.replies.map(reply => (
              <div key={reply.id} className="flex gap-3 items-start">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">{reply.author.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{reply.author}</span>
                    <span className="text-xs text-gray-500">{timeAgo(reply.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{reply.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Input */}
        {showReplyInput && (
          <div className="ml-10 mt-2 flex gap-3 items-start">
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">CU</AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-lg border border-gray-200 bg-white p-3">
              <Textarea
                placeholder="Add a reply..."
                className="w-full border-none focus-visible:ring-0 resize-none bg-transparent text-gray-900 placeholder:text-gray-500"
                rows={2}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                disabled={isReplying}
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={handlePostReply} disabled={!replyContent.trim() || isReplying} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Send className="w-3 h-3 mr-1" /> {isReplying ? "Replying..." : "Reply"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
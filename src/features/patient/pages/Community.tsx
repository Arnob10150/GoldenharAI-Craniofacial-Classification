import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareReply, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingPanel } from "@/shared/components/LoadingPanel";
import { PageHeader } from "@/shared/components/PageHeader";
import { PageTransition } from "@/shared/components/PageTransition";
import { createPost, createReply, getProfileDisplayName, listPosts, listReplies, subscribeToRealtimeEvents } from "@/shared/lib/data";
import { formatDateTime } from "@/shared/lib/format";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { CommunityPost, CommunityReply, LanguagePref } from "@/shared/lib/types";

const postSchema = z.object({
  title: z.string().min(5, "Add a clear title"),
  body: z.string().min(20, "Share enough context for other families or clinicians"),
  language: z.enum(["en", "bn"]),
});

const replySchema = z.object({
  body: z.string().min(3, "Reply cannot be empty"),
  language: z.enum(["en", "bn"]),
});

type PostForm = z.infer<typeof postSchema>;
type ReplyForm = z.infer<typeof replySchema>;

export default function Community() {
  const { profile } = useAuthStore();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const postForm = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: { title: "", body: "", language: profile?.language_pref ?? "en" },
  });

  const replyForm = useForm<ReplyForm>({
    resolver: zodResolver(replySchema),
    defaultValues: { body: "", language: profile?.language_pref ?? "en" },
  });

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      const postRows = await listPosts();
      if (!ignore) {
        setPosts(postRows);
        setSelectedPostId((current) => current ?? postRows[0]?.id ?? null);
        setLoading(false);
      }
    };
    void run();
    const unsubscribe = subscribeToRealtimeEvents((event) => {
      if (event.entity === "posts" || event.entity === "replies") {
        void run();
      }
    });
    return () => {
      ignore = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!selectedPostId) {
        setReplies([]);
        return;
      }
      const replyRows = await listReplies(selectedPostId);
      if (!ignore) {
        setReplies(replyRows);
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [selectedPostId]);

  const selectedPost = useMemo(() => posts.find((post) => post.id === selectedPostId) ?? null, [posts, selectedPostId]);

  const submitPost = postForm.handleSubmit(async (values) => {
    if (!profile) return;
    try {
      const post = await createPost(profile, { ...values, language: values.language as LanguagePref });
      setPosts((current) => [post, ...current]);
      setSelectedPostId(post.id);
      postForm.reset({ title: "", body: "", language: values.language });
      toast.success("Post published.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to publish post.");
    }
  });

  const submitReply = replyForm.handleSubmit(async (values) => {
    if (!profile || !selectedPostId) return;
    try {
      const reply = await createReply(profile, { postId: selectedPostId, body: values.body, language: values.language as LanguagePref });
      setReplies((current) => [...current, reply]);
      setPosts((current) => current.map((post) => post.id === selectedPostId ? { ...post, replies_count: post.replies_count + 1 } : post));
      replyForm.reset({ body: "", language: values.language });
      toast.success("Reply posted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send reply.");
    }
  });

  if (!profile || loading) {
    return <LoadingPanel title="Loading community forum" description="Fetching parent and clinician conversations with realtime reply updates." />;
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader title="Community forum" description="A bilingual space for parents, CHWs, and clinicians to share questions, practical tips, and referral experiences." />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Create a post</CardTitle>
              <CardDescription>Share your question or update in English or Bengali.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submitPost}>
                <div className="space-y-2">
                  <Label htmlFor="post-title">Title</Label>
                  <Input id="post-title" placeholder="Hearing test before ENT referral?" {...postForm.register("title")} />
                  {postForm.formState.errors.title ? <p className="text-sm text-destructive">{postForm.formState.errors.title.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-body">Message</Label>
                  <Textarea id="post-body" rows={5} placeholder="Describe your question, what the scan showed, and what kind of support you need." {...postForm.register("body")} />
                  {postForm.formState.errors.body ? <p className="text-sm text-destructive">{postForm.formState.errors.body.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Controller
                    control={postForm.control}
                    name="language"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Choose language" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="bn">?????</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <Button type="submit" className="gap-2"><Send className="size-4" /> Publish post</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Posts</CardTitle>
              <CardDescription>Select a thread to read replies.</CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length ? (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      className={`w-full rounded-3xl border p-4 text-left transition ${selectedPostId === post.id ? "border-primary bg-primary/5" : "border-border/60 bg-card/60 hover:bg-muted/40"}`}
                      onClick={() => setSelectedPostId(post.id)}
                    >
                      <div className="font-semibold">{post.title}</div>
                      <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.body}</div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{getProfileDisplayName(post.author_id).split(" ")[0]}</span>
                        <span>{post.replies_count} replies · {formatDateTime(post.created_at)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="No posts yet" description="Start the first conversation for families and clinicians in the network." />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{selectedPost?.title || "Thread"}</CardTitle>
            <CardDescription>
              {selectedPost ? `${getProfileDisplayName(selectedPost.author_id).split(" ")[0]} · ${formatDateTime(selectedPost.created_at)}` : "Choose a post to view replies."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedPost ? (
              <>
                <div className="rounded-3xl bg-muted/40 p-5 text-sm leading-7">{selectedPost.body}</div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold"><MessageSquareReply className="size-4 text-primary" /> Replies</div>
                  {replies.length ? (
                    replies.map((reply) => (
                      <div key={reply.id} className="rounded-3xl border border-border/60 bg-card/60 p-4 shadow-sm">
                        <div className="text-sm leading-7">{reply.body}</div>
                        <div className="mt-3 text-xs text-muted-foreground">{getProfileDisplayName(reply.author_id).split(" ")[0]} · {formatDateTime(reply.created_at)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">No replies yet. You can start the conversation.</div>
                  )}
                </div>
                <form className="space-y-4 rounded-3xl border border-border/60 bg-card/60 p-5" onSubmit={submitReply}>
                  <div className="space-y-2">
                    <Label htmlFor="reply-body">Reply</Label>
                    <Textarea id="reply-body" rows={4} placeholder="Share a helpful response, resource, or referral tip." {...replyForm.register("body")} />
                    {replyForm.formState.errors.body ? <p className="text-sm text-destructive">{replyForm.formState.errors.body.message}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Controller
                      control={replyForm.control}
                      name="language"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="Choose language" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="bn">?????</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <Button type="submit" className="gap-2"><Send className="size-4" /> Reply</Button>
                </form>
              </>
            ) : (
              <EmptyState title="Select a thread" description="Choose any post from the left to read and reply in realtime." />
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

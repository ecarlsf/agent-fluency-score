import { createPost, updatePost, deletePost } from "./actions";
import { getAuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DashboardPage() {
  const user = await getAuthUser();
  const { prisma } = await import("@/lib/prisma");
  const posts = await prisma.post.findMany({
    where: user.orgId ? { orgId: user.orgId } : { authorId: user.id },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your posts</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>New Post</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Post</DialogTitle>
            </DialogHeader>
            <form action={createPost} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-title">Title</Label>
                <Input id="new-title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-content">Content</Label>
                <Textarea id="new-content" name="content" required />
              </div>
              <Button type="submit">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No posts yet</CardTitle>
            <CardDescription>
              Create your first post to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>
                  {post.published ? (
                    <span className="text-green-600">Published</span>
                  ) : (
                    <span className="text-muted-foreground">Draft</span>
                  )}
                </TableCell>
                <TableCell>
                  {post.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Post</DialogTitle>
                        </DialogHeader>
                        <form action={updatePost} className="space-y-4">
                          <input type="hidden" name="id" value={post.id} />
                          <div className="space-y-2">
                            <Label htmlFor={`title-${post.id}`}>Title</Label>
                            <Input
                              id={`title-${post.id}`}
                              name="title"
                              defaultValue={post.title}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`content-${post.id}`}>
                              Content
                            </Label>
                            <Textarea
                              id={`content-${post.id}`}
                              name="content"
                              defaultValue={post.content}
                              required
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`published-${post.id}`}
                              name="published"
                              defaultChecked={post.published}
                            />
                            <Label htmlFor={`published-${post.id}`}>
                              Published
                            </Label>
                          </div>
                          <Button type="submit">Save</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={post.id} />
                      <Button variant="destructive" size="sm" type="submit">
                        Delete
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

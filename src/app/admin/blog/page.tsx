'use client';

import { useState, useMemo } from 'react';
import { 
  useGetBlogPostsQuery, 
  useCreateBlogPostMutation, 
  useUpdateBlogPostMutation, 
  useDeleteBlogPostMutation,
  BlogPost 
} from '@/services/api/blogApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Clock,
  Save,
  X,
  ExternalLink,
  Star,
  Image as ImageIcon,
  FileText,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const categories = ['Fashion', 'Lifestyle', 'Sustainability', 'Trends', 'Styling'];

export default function AdminBlogPage() {
  const { data: postsResponse, isLoading: isLoadingPosts, refetch } = useGetBlogPostsQuery({ limit: 100 });
  const [createPost, { isLoading: isCreating }] = useCreateBlogPostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdateBlogPostMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeleteBlogPostMutation();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Fashion',
    image: '',
    readTime: '5 min read',
    isFeatured: false,
    isPublished: true,
  });

  const posts = postsResponse?.data || [];

  const filteredPosts = useMemo(() => {
    if (!search) return posts;
    const term = search.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(term) ||
        post.excerpt.toLowerCase().includes(term) ||
        post.category.toLowerCase().includes(term)
    );
  }, [posts, search]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'Fashion',
      image: '',
      readTime: '5 min read',
      isFeatured: false,
      isPublished: true,
    });
    setShowForm(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({ ...post });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setDeleteConfirm(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async () => {
    if (!form.title || !form.excerpt || !form.content) return;

    const slug = form.slug || generateSlug(form.title);
    const postData = { ...form, slug };

    try {
      if (editingId) {
        await updatePost({ id: editingId, ...postData }).unwrap();
        setSuccessMessage('Article updated successfully!');
      } else {
        await createPost(postData).unwrap();
        setSuccessMessage('Article created successfully!');
      }
      handleCloseForm();
      refetch();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePost(id).unwrap();
      setSuccessMessage('Article deleted successfully!');
      setDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const isLoading = isLoadingPosts || isCreating || isUpdating || isDeleting;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Journal / Blog</h1>
          <p className="text-muted-foreground mt-1">
            Manage your articles and journal content.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" /> New Article
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Articles', value: posts.length, icon: FileText },
          { label: 'Published', value: posts.filter(p => p.isPublished).length, icon: Eye, color: 'text-green-600' },
          { label: 'Featured', value: posts.filter(p => p.isFeatured).length, icon: Star, color: 'text-amber-600' },
          { label: 'Drafts', value: posts.filter(p => !p.isPublished).length, icon: EyeOff, color: 'text-muted-foreground' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <Icon className={`h-5 w-5 ${color || 'text-muted-foreground'}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles by title, excerpt, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle>All Articles</CardTitle>
          <CardDescription>
            {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No articles found.</p>
              <Button variant="outline" onClick={handleOpenCreate} className="mt-4">
                Create your first article
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {post.image ? (
                      <img src={post.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium truncate">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{post.excerpt}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(post)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteConfirm(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <Badge variant="secondary">{post.category}</Badge>
                      {!post.isPublished && (
                        <Badge variant="outline">Draft</Badge>
                      )}
                      {post.isFeatured && (
                        <Badge className="bg-amber-100 text-amber-800">Featured</Badge>
                      )}
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                      <Link 
                        href={`/journal/${post.slug}`} 
                        target="_blank"
                        className="text-primary hover:underline flex items-center gap-1 ml-auto"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={handleCloseForm}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-4 md:inset-10 bg-card rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-semibold">
                    {editingId ? 'Edit Article' : 'Create New Article'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {editingId ? `ID: ${editingId}` : 'Fill in the details below'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleCloseForm}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {editingId ? 'Update' : 'Publish'}
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Title & Slug */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Article title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={form.slug || generateSlug(form.title || '')}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        placeholder="auto-generated-from-title"
                      />
                    </div>
                  </div>

                  {/* Category & Read Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border bg-background"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="readTime">Read Time</Label>
                      <Input
                        id="readTime"
                        value={form.readTime}
                        onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                        placeholder="e.g., 5 min read"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">Featured Image URL</Label>
                      <Input
                        id="image"
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Image Preview */}
                  {form.image && (
                    <div className="rounded-lg overflow-hidden h-48">
                      <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Excerpt */}
                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt *</Label>
                    <Textarea
                      id="excerpt"
                      value={form.excerpt}
                      onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                      placeholder="Short summary of the article..."
                      rows={3}
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Full article content..."
                      rows={12}
                    />
                  </div>

                  {/* Options */}
                  <div className="flex items-center gap-6 p-4 bg-muted rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isPublished}
                        onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>Published</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isFeatured}
                        onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>Featured on homepage</span>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-xl shadow-2xl z-50 p-6"
            >
              <div className="flex items-center gap-3 text-destructive mb-4">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Delete Article?</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                This action cannot be undone. The article will be permanently removed from your journal.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

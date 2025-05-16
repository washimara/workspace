import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/useToast"
import { createPost, updatePost } from "@/api/posts"
import { Post } from "@/types"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTheme } from "@/components/ui/theme-provider"
import { useThemeContext } from "@/contexts/ThemeContext"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const MAX_CUSTOM_FIELDS = 5
const MAX_TAGS = 5

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  location: z.string().optional(),
})

interface PostFormProps {
  post?: Post
  isEditing?: boolean
}

export function PostForm({ post, isEditing = false }: PostFormProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { theme } = useTheme()
  const { currentTheme } = useThemeContext()

  const [customFields, setCustomFields] = useState<{ name: string; value: string }[]>(
    post?.customFields || []
  )
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldValue, setNewFieldValue] = useState("")

  const [tags, setTags] = useState<string[]>(post?.tags || [])
  const [newTag, setNewTag] = useState("")

  // Determine text colors based on theme - FIXED FOR DARK MODE
  const textColor = theme === "dark"
    ? "text-white"
    : currentTheme.value === "green-forest"
      ? "text-black"
      : currentTheme.textPrimary

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: post?.title || "",
      description: post?.description || "",
      image: post?.image || "",
      location: post?.location || "",
    },
  })

  const addCustomField = () => {
    if (customFields.length >= MAX_CUSTOM_FIELDS) {
      toast({
        title: t("limitReached"),
        description: t("customFieldsLimit").replace("{limit}", MAX_CUSTOM_FIELDS.toString()),
        variant: "destructive",
      })
      return
    }

    if (newFieldName.trim() && newFieldValue.trim()) {
      setCustomFields([...customFields, { name: newFieldName, value: newFieldValue }])
      setNewFieldName("")
      setNewFieldValue("")
    }
  }

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (tags.length >= MAX_TAGS) {
      toast({
        title: t("limitReached"),
        description: t("tagsLimit").replace("{limit}", MAX_TAGS.toString()),
        variant: "destructive",
      })
      return
    }

    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const data = {
        ...values,
        customFields, // This will be converted to custom_fields in the API function
        tags,
      }

      if (isEditing && post) {
        const result = await updatePost(post.id || post._id, data);
        toast({
          title: t("success"),
          description: t("postUpdated"),
        })
      } else {
        console.log("Creating post with data:", data);
        const result = await createPost(data);
        console.log("Post created:", result);
        toast({
          title: t("success"),
          description: t("postCreated"),
        })
      }

      navigate("/my-posts");
    } catch (error: any) {
      console.error("Post form submission error:", error);
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={textColor}>{t("title")}*</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("enterTitle")}
                  {...field}
                  className="bg-background text-foreground"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={textColor}>{t("description")}*</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("enterDescription")}
                  className="min-h-[120px] bg-background text-foreground"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={textColor}>{t("imageUrl")}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t("enterImageUrl")} 
                  {...field} 
                  className="bg-background text-foreground"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={textColor}>{t("location")}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t("enterLocation")} 
                  {...field} 
                  className="bg-background text-foreground"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div>
            <FormLabel className={textColor}>{t("customFields")} ({customFields.length}/{MAX_CUSTOM_FIELDS})</FormLabel>
            <div className="flex flex-col gap-2">
              {customFields.map((field, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 bg-muted p-2 rounded-md flex justify-between items-center">
                    <span className={textColor}>
                      <strong>{field.name}:</strong> {field.value}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {customFields.length < MAX_CUSTOM_FIELDS && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder={t("fieldName")}
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="flex-1 bg-background text-foreground"
                />
                <Input
                  placeholder={t("fieldValue")}
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="flex-1 bg-background text-foreground"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addCustomField}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div>
            <FormLabel className={textColor}>{t("tags")} ({tags.length}/{MAX_TAGS})</FormLabel>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  #{tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            {tags.length < MAX_TAGS && (
              <div className="flex gap-2">
                <Input
                  placeholder={t("enterTag")}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 bg-background text-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  {t("add")}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/my-posts")}
          >
            {t("cancel")}
          </Button>
          <Button type="submit">
            {isEditing ? t("update") : t("create")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
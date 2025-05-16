import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/useToast"
import { createAdvert, updateAdvert } from "@/api/adverts"
import { Advert } from "@/types"

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

interface AdvertFormProps {
  advert?: Advert
  isEditing?: boolean
}

export function AdvertForm({ advert, isEditing = false }: AdvertFormProps) {
  const { toast } = useToast()
  const navigate = useNavigate()

  const [customFields, setCustomFields] = useState<{ name: string; value: string }[]>(
    advert?.customFields || []
  )
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldValue, setNewFieldValue] = useState("")

  const [tags, setTags] = useState<string[]>(advert?.tags || [])
  const [newTag, setNewTag] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: advert?.title || "",
      description: advert?.description || "",
      image: advert?.image || "",
      location: advert?.location || "",
    },
  })

  const addCustomField = () => {
    if (customFields.length >= MAX_CUSTOM_FIELDS) {
      toast({
        title: "Limit reached",
        description: `You can only add up to ${MAX_CUSTOM_FIELDS} custom fields.`,
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
        title: "Limit reached",
        description: `You can only add up to ${MAX_TAGS} tags.`,
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
        customFields,
        tags,
      }

      if (isEditing && advert) {
        await updateAdvert(advert._id, data)
        toast({
          title: "Success",
          description: "Advert updated successfully",
        })
      } else {
        await createAdvert(data)
        toast({
          title: "Success",
          description: "Advert created successfully",
        })
      }
      navigate("/my-adverts")
    } catch (error: any) {
      toast({
        title: "Error",
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
              <FormLabel>Title*</FormLabel>
              <FormControl>
                <Input placeholder="Enter title" {...field} />
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
              <FormLabel>Description*</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter description"
                  className="min-h-[120px]"
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
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="Enter image URL" {...field} />
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
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Enter location" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div>
            <FormLabel>Custom Fields ({customFields.length}/{MAX_CUSTOM_FIELDS})</FormLabel>
            <div className="flex flex-col gap-2">
              {customFields.map((field, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 bg-muted p-2 rounded-md flex justify-between items-center">
                    <span>
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
                  placeholder="Field name"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Field value"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="flex-1"
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
            <FormLabel>Tags ({tags.length}/{MAX_TAGS})</FormLabel>
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
                  placeholder="Enter tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/my-adverts")}
          >
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update Advert" : "Create Advert"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
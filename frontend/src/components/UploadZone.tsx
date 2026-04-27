import { Check, CloudUpload, FileText, Lock, Loader2, Sparkles, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/95 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/30">
      {n}
    </span>
  )
}

export interface UploadZoneProps {
  onAnalyze: (file: File, jobTitle: string) => void
  onValidationError?: (message: string | null) => void
  isLoading: boolean
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
])

export function UploadZone({ onAnalyze, onValidationError, isLoading }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const setValidationState = (message: string | null) => {
    setValidationError(message)
    onValidationError?.(message)
  }

  const validateFile = (candidate: File): string | null => {
    if (!ALLOWED_MIME_TYPES.has(candidate.type)) {
      return 'Unsupported file type. Please upload PDF, DOCX, or TXT.'
    }

    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      return 'File is too large. Max size is 5MB.'
    }

    return null
  }

  const setFromFiles = (list: FileList | null) => {
    const f = list?.[0]
    if (!f) return

    const error = validateFile(f)
    if (error) {
      setFile(null)
      setValidationState(error)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setFile(f)
    setValidationState(null)
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    setFromFiles(e.dataTransfer.files)
  }, [])

  const canSubmit = Boolean(file && jobTitle.trim()) && !isLoading

  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2">
      <Card className="flex h-full flex-col border-border/80 bg-card/85 shadow-lg shadow-black/20">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
          <StepBadge n={1} />
          <CardTitle className="text-base">Upload Your CV</CardTitle>
        </CardHeader>
        <CardContent className="grid flex-1 grid-rows-[1fr_auto_auto] gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => setFromFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              'w-full rounded-xl border border-dashed border-border bg-[#0b1535] px-6 py-5 text-center transition-colors hover:border-primary/60 hover:bg-[#101b45]',
              dragOver && 'border-primary bg-primary/5',
            )}
          >
            <CloudUpload className="mx-auto mb-2 size-8 text-[#7f93d4]" />
            <p className="text-sm text-foreground">
              Drag & drop your CV here or{' '}
              <span className="font-medium text-primary underline-offset-2 hover:underline">
                click to browse
              </span>
            </p>
          </button>

          <div className="min-h-11">
            {file ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-[#111b3f] px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Check className="size-4 text-emerald-500" aria-hidden />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setFile(null)
                      setValidationState(null)
                      if (inputRef.current) inputRef.current.value = ''
                    }}
                    disabled={isLoading}
                    aria-label="Remove file"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Supported formats: PDF, DOCX, TXT (max 5MB)</p>
            {validationError ? (
              <p className="text-xs text-red-300" role="alert">
                {validationError}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col border-border/80 bg-card/85 shadow-lg shadow-black/20">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
          <StepBadge n={2} />
          <CardTitle className="text-base">Target Job Title</CardTitle>
        </CardHeader>
        <CardContent className="grid flex-1 grid-rows-[1fr_auto_auto] gap-3">
          <div className="space-y-2 self-start">
            <Label htmlFor="job-title">Enter the target role you want to match</Label>
            <Input
              id="job-title"
              placeholder="Senior Full Stack Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button
            className="h-10 w-full self-start bg-primary font-semibold shadow-lg shadow-primary/35 hover:bg-primary/90"
            type="button"
            disabled={!canSubmit}
            onClick={() => file && onAnalyze(file, jobTitle.trim())}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Analyze CV
              </>
            )}
          </Button>
          <p className="flex items-center justify-center gap-1.5 self-end text-center text-xs text-muted-foreground">
            <Lock className="size-3.5 shrink-0 text-muted-foreground/80" />
            Your data is secure and will not be shared.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

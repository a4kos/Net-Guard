"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Template form - no backend connected
    setSubmitted(true)
  }

  return (
    <section id="contact" className="scroll-mt-20">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Contact Us
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Report a false positive, request a feature, or get in touch with the team.
          </p>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="rounded-lg border border-border bg-secondary/50 p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--chart-4))]/15">
                <Send className="h-5 w-5 text-[hsl(var(--chart-4))]" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Message Sent</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Thank you for reaching out. We will get back to you shortly.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setSubmitted(false)}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-foreground">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    required
                    className="border-border bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="border-border bg-secondary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm text-foreground">
                  Subject
                </Label>
                <Input
                  id="subject"
                  placeholder="e.g., False positive report"
                  required
                  className="border-border bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm text-foreground">
                  Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or feedback..."
                  rows={5}
                  required
                  className="border-border bg-secondary/50 resize-none"
                />
              </div>

              <Button type="submit" className="gap-2">
                <Send className="h-4 w-4" />
                Send Message
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

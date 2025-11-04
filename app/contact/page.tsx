import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MessageCircle, Clock, MapPin, Phone, Send } from "lucide-react"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/seo"

export const metadata: Metadata = generatePageMetadata(
  "Contact Us",
  "Get in touch with the Agasobanuye Movies team. We're here to help with any questions, feedback, or support you need for your streaming experience.",
  "/contact"
)

export default function ContactPage() {
  const contactMethods = [
    {
      title: "Email Support",
      description: "Send us an email and we'll get back to you within 24 hours",
      icon: <Mail className="h-6 w-6" />,
      contact: "support@ag.micorp.pro",
      action: "Send Email"
    },
    {
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      icon: <MessageCircle className="h-6 w-6" />,
      contact: "Available 24/7",
      action: "Start Chat"
    },
    {
      title: "Response Time",
      description: "We typically respond to inquiries quickly",
      icon: <Clock className="h-6 w-6" />,
      contact: "Within 24 hours",
      action: "Learn More"
    }
  ]

  const teamContacts = [
    {
      name: "Igiraneza Patrick",
      role: "Founder & Lead Developer",
      email: "patrick@ag.micorp.pro",
      website: "https://igiranezapatrick.micorp.pro"
    },
    {
      name: "Chaste Djaziri",
      role: "Fullstack Developer & UI/UX",
      email: "chaste@ag.micorp.pro",
      website: "https://chastedjaziri.micorp.pro"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/10 to-transparent py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us how we can help you..."
                    className="min-h-[120px]"
                  />
                </div>
                
                <Button className="w-full" size="lg">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Contact Methods */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Get in Touch</h2>
                <div className="space-y-4">
                  {contactMethods.map((method, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {method.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">{method.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                            <p className="text-sm font-medium text-primary">{method.contact}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Team Contacts */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Meet the Team</h2>
                <div className="space-y-4">
                  {teamContacts.map((member, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                            <p className="text-sm text-primary">{member.email}</p>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <Link href={member.website} target="_blank" rel="noopener noreferrer">
                              Portfolio
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-3">Office Information</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Remote Team - Global</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Monday - Friday, 9:00 AM - 6:00 PM (UTC)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>Available via email and live chat</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="bg-muted/50 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Need Quick Answers?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Check out our Help Center for instant answers to common questions.
            </p>
            <Button asChild size="lg" variant="outline">
              <Link href="/help">
                <MessageCircle className="h-5 w-5 mr-2" />
                Visit Help Center
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}


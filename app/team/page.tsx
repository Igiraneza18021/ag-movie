import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Github, Linkedin, Mail, ExternalLink } from "lucide-react"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/seo"

export const metadata: Metadata = generatePageMetadata(
  "Agasobanuye Movies Team",
  "Meet the talented team behind Agasobanuye Movies. Learn about our founders, developers, and the passionate people who make streaming movies and TV shows possible.",
  "/team"
)

export default function TeamPage() {
  const teamMembers = [
    {
      name: "Igiraneza Patrick",
      role: "Founder & Lead Developer",
      bio: "Visionary leader and technical architect behind Agasobanuye Movies. Patrick brings years of experience in full-stack development and a passion for creating exceptional streaming experiences.",
      website: "https://igiranezapatrick.micorp.pro",
      avatar: "/placeholder-user.jpg",
      skills: ["Full-Stack Development", "System Architecture", "Product Strategy", "Team Leadership"],
      social: {
        website: "https://igiranezapatrick.micorp.pro"
      }
    },
    {
      name: "Chaste Djaziri",
      role: "Fullstack Developer & UI/UX Designer",
      bio: "Creative developer and design enthusiast who crafts beautiful, intuitive user experiences. Chaste combines technical expertise with a keen eye for design to create seamless streaming interfaces.",
      website: "https://chastedjaziri.micorp.pro",
      avatar: "/placeholder-user.jpg",
      skills: ["Frontend Development", "UI/UX Design", "React/Next.js", "User Experience"],
      social: {
        website: "https://chastedjaziri.micorp.pro"
      }
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
              Meet the Agasobanuye Movies Team
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're a passionate team of developers, designers, and innovators dedicated to bringing you the best streaming experience possible.
            </p>
          </div>
        </div>

        {/* Team Members */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {teamMembers.map((member, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-lg">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-2xl">{member.name}</CardTitle>
                  <CardDescription className="text-lg text-primary font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {member.bio}
                  </p>
                  
                  {/* Skills */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Skills & Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Social Links */}
                  <div className="flex justify-center gap-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={member.social.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Portfolio
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                At Agasobanuye Movies, we believe that entertainment should be accessible, seamless, and enjoyable for everyone. 
                Our team is committed to creating innovative streaming solutions that bring people together through the power of movies and TV shows.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">Innovation</div>
                  <p className="text-muted-foreground">Pushing the boundaries of streaming technology</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">Quality</div>
                  <p className="text-muted-foreground">Delivering exceptional user experiences</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">Community</div>
                  <p className="text-muted-foreground">Building connections through entertainment</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Get in Touch</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Have questions about our platform or want to collaborate? We'd love to hear from you!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/contact">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Us
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/help">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Help Center
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}


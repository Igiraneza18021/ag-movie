import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Users, Globe, Heart, Award, Zap } from "lucide-react"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/seo"

export const metadata: Metadata = generatePageMetadata(
  "About Us",
  "Learn about Agasobanuye Movies - your ultimate destination for streaming movies and TV shows. Discover our mission, values, and commitment to entertainment.",
  "/about"
)

export default function AboutPage() {
  const values = [
    {
      title: "Accessibility",
      description: "Making entertainment accessible to everyone, everywhere",
      icon: <Globe className="h-8 w-8" />
    },
    {
      title: "Quality",
      description: "Delivering high-quality streaming experiences",
      icon: <Award className="h-8 w-8" />
    },
    {
      title: "Innovation",
      description: "Continuously improving our platform and features",
      icon: <Zap className="h-8 w-8" />
    },
    {
      title: "Community",
      description: "Building connections through shared entertainment",
      icon: <Users className="h-8 w-8" />
    }
  ]

  const stats = [
    { label: "Movies Available", value: "10,000+" },
    { label: "TV Shows", value: "5,000+" },
    { label: "Active Users", value: "100,000+" },
    { label: "Countries Served", value: "50+" }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/10 to-transparent py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              About Agasobanuye Movies
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your ultimate destination for streaming movies and TV shows. We're passionate about bringing entertainment to your fingertips.
            </p>
          </div>
        </div>

        {/* Our Story */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl text-center">Our Story</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Agasobanuye Movies was born from a simple idea: entertainment should be accessible, seamless, and enjoyable for everyone. 
                  Founded by a passionate team of developers and entertainment enthusiasts, we set out to create a streaming platform 
                  that puts the user experience first.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  What started as a vision to revolutionize how people discover and enjoy movies and TV shows has grown into a 
                  comprehensive platform that serves users worldwide. We believe that great entertainment brings people together, 
                  sparks conversations, and creates lasting memories.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Today, Agasobanuye Movies continues to evolve, incorporating cutting-edge technology and user feedback to deliver an 
                  unparalleled streaming experience. Our commitment to quality, innovation, and user satisfaction drives everything we do.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Our Values */}
        <div className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-primary/10 rounded-lg">
                        {value.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">By the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-6 w-6 text-primary" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    To democratize entertainment by providing free, high-quality streaming services that bring people together 
                    through the power of movies and TV shows. We believe everyone deserves access to great entertainment, 
                    regardless of their location or economic status.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-6 w-6 text-primary" />
                    Our Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    To become the world's most trusted and innovative streaming platform, known for our exceptional user 
                    experience, diverse content library, and commitment to making entertainment accessible to everyone. 
                    We envision a future where great stories are just a click away.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Team CTA */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Behind Agasobanuye Movies is a dedicated team of developers, designers, and entertainment enthusiasts 
              who work tirelessly to bring you the best streaming experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/team">
                  <Users className="h-5 w-5 mr-2" />
                  Meet the Team
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">
                  <Heart className="h-5 w-5 mr-2" />
                  Get in Touch
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


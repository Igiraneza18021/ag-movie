import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, HelpCircle, Mail, MessageCircle, BookOpen, Video, Download, Play } from "lucide-react"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/seo"

export const metadata: Metadata = generatePageMetadata(
  "Help Center",
  "Get help with Agasobanuye Movies. Find answers to common questions, learn how to use our platform, and get support for streaming movies and TV shows.",
  "/help"
)

export default function HelpCenterPage() {
  const faqCategories = [
    {
      title: "Getting Started",
      icon: <Play className="h-5 w-5" />,
      questions: [
        {
          question: "How do I start watching movies on Agasobanuye Movies?",
          answer: "Simply browse our collection of movies and TV shows, click on any title you're interested in, and hit the play button. No registration required for basic viewing."
        },
        {
          question: "Do I need to create an account?",
          answer: "While you can browse and watch content without an account, creating an account allows you to save your watchlist, get personalized recommendations, and access additional features."
        },
        {
          question: "Is Agasobanuye Movies free to use?",
          answer: "Yes! Agasobanuye Movies is completely free to use. We believe entertainment should be accessible to everyone."
        }
      ]
    },
    {
      title: "Streaming & Playback",
      icon: <Video className="h-5 w-5" />,
      questions: [
        {
          question: "What video quality is available?",
          answer: "We provide high-quality streaming in HD and Full HD where available. The quality automatically adjusts based on your internet connection."
        },
        {
          question: "Can I download movies for offline viewing?",
          answer: "Yes! Many of our movies and TV shows offer download options. Look for the download button on the content page."
        },
        {
          question: "Why is my video buffering?",
          answer: "Buffering usually occurs due to slow internet connection. Try reducing video quality or check your internet speed. We recommend at least 5 Mbps for HD streaming."
        }
      ]
    },
    {
      title: "Account & Settings",
      icon: <BookOpen className="h-5 w-5" />,
      questions: [
        {
          question: "How do I create a watchlist?",
          answer: "Click the '+' button on any movie or TV show card to add it to your watchlist. You can access your watchlist from your profile."
        },
        {
          question: "Can I change my account settings?",
          answer: "Yes, you can update your profile information, preferences, and privacy settings from your account dashboard."
        },
        {
          question: "How do I delete my account?",
          answer: "You can delete your account from the account settings page. This action is irreversible and will remove all your data."
        }
      ]
    }
  ]

  const helpTopics = [
    {
      title: "How to Watch Movies",
      description: "Learn the basics of streaming on our platform",
      icon: <Play className="h-6 w-6" />,
      href: "/help/watching-movies"
    },
    {
      title: "Download Content",
      description: "Download movies and shows for offline viewing",
      icon: <Download className="h-6 w-6" />,
      href: "/help/downloading"
    },
    {
      title: "Account Management",
      description: "Manage your profile and preferences",
      icon: <BookOpen className="h-6 w-6" />,
      href: "/help/account"
    },
    {
      title: "Troubleshooting",
      description: "Fix common issues and problems",
      icon: <HelpCircle className="h-6 w-6" />,
      href: "/help/troubleshooting"
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
              Help Center
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Find answers to your questions and get the most out of Agasobanuye Movies
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  placeholder="Search for help articles..." 
                  className="pl-10 pr-4 py-3 text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Help Topics */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Quick Help Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {helpTopics.map((topic, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      {topic.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{topic.title}</h3>
                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Frequently Asked Questions</h2>
            
            <div className="max-w-4xl mx-auto space-y-8">
              {faqCategories.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {category.icon}
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, faqIndex) => (
                        <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Still Need Help?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Can't find what you're looking for? Our support team is here to help you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/contact">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Support
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/team">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Meet the Team
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


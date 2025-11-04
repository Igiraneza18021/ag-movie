import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, HelpCircle, Mail, MessageCircle, Play, Download, Shield, CreditCard } from "lucide-react"
import Link from "next/link"
import { generatePageMetadata } from "@/lib/seo"

export const metadata: Metadata = generatePageMetadata(
  "FAQ - Frequently Asked Questions",
  "Find answers to common questions about Agasobanuye Movies. Get help with streaming, downloads, account management, and more.",
  "/faq"
)

export default function FAQPage() {
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
        },
        {
          question: "What devices can I use to watch Agasobanuye Movies?",
          answer: "You can watch Agasobanuye Movies on any device with a web browser, including computers, tablets, and smartphones. We're working on dedicated mobile apps."
        }
      ]
    },
    {
      title: "Streaming & Playback",
      icon: <Play className="h-5 w-5" />,
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
        },
        {
          question: "Can I watch movies with subtitles?",
          answer: "Yes, many of our movies and TV shows include subtitle options. You can enable/disable subtitles using the video player controls."
        }
      ]
    },
    {
      title: "Account & Settings",
      icon: <Shield className="h-5 w-5" />,
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
        },
        {
          question: "Is my personal information safe?",
          answer: "Yes, we take your privacy seriously. We use industry-standard security measures to protect your personal information. Read our Privacy Policy for more details."
        }
      ]
    },
    {
      title: "Technical Support",
      icon: <HelpCircle className="h-5 w-5" />,
      questions: [
        {
          question: "The video won't play. What should I do?",
          answer: "Try refreshing the page, clearing your browser cache, or checking your internet connection. If the problem persists, contact our support team."
        },
        {
          question: "What browsers are supported?",
          answer: "We support all modern browsers including Chrome, Firefox, Safari, and Edge. Make sure your browser is updated to the latest version."
        },
        {
          question: "Can I use Agasobanuye Movies on mobile?",
          answer: "Yes, Agasobanuye Movies works on mobile devices through your web browser. We're working on dedicated mobile apps for iOS and Android."
        },
        {
          question: "Why can't I find a specific movie or TV show?",
          answer: "Our content library is constantly growing. If you can't find something, it might not be available yet. You can request content through our contact form."
        }
      ]
    },
    {
      title: "Content & Library",
      icon: <Download className="h-5 w-5" />,
      questions: [
        {
          question: "How often is new content added?",
          answer: "We add new movies and TV shows regularly. Follow us on social media or check our 'Coming Soon' section for the latest additions."
        },
        {
          question: "Can I request specific movies or TV shows?",
          answer: "Yes! We welcome content requests. Send us your suggestions through our contact form, and we'll do our best to add them to our library."
        },
        {
          question: "Are there age restrictions on content?",
          answer: "Some content may have age restrictions. We provide content ratings and warnings to help you make informed viewing choices."
        },
        {
          question: "Do you have content in different languages?",
          answer: "Yes, we have content in multiple languages. You can filter by language or use subtitles for content in other languages."
        }
      ]
    }
  ]

  const quickLinks = [
    {
      title: "Contact Support",
      description: "Get help from our support team",
      icon: <Mail className="h-6 w-6" />,
      href: "/contact"
    },
    {
      title: "Help Center",
      description: "Browse our comprehensive help articles",
      icon: <MessageCircle className="h-6 w-6" />,
      href: "/help"
    },
    {
      title: "Privacy Policy",
      description: "Learn about how we protect your data",
      icon: <Shield className="h-6 w-6" />,
      href: "/privacy"
    },
    {
      title: "Terms of Service",
      description: "Read our terms and conditions",
      icon: <HelpCircle className="h-6 w-6" />,
      href: "/terms"
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
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Find quick answers to the most common questions about Agasobanuye Movies
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  placeholder="Search FAQ..." 
                  className="pl-10 pr-4 py-3 text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      {link.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Browse by Category</h2>
            
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

        {/* Still Need Help */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Still Need Help?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Can't find the answer you're looking for? Our support team is here to help you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/contact">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Support
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/help">
                  <MessageCircle className="h-5 w-5 mr-2" />
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
